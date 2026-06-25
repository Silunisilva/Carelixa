"""
Prediction service for autism children progress model.
Loads trained models and makes predictions based on weekly progress data.
"""

import pandas as pd
import numpy as np
import joblib
import os
from sklearn.impute import SimpleImputer

class PredictionService:
    def __init__(self, model_dir="models"):
        self.model_dir = model_dir
        self.classifier = None
        self.regressor = None
        self.imputer = None
        self.feature_cols = None
        self.skill_areas = {
            "Communication": ["child_q1", "child_q2"],
            "Social": ["child_q3", "child_q4"],
            "Behavioral": ["child_q5", "child_q6"],
            "Home": ["parent_q1", "parent_q2", "parent_q3"],
        }
        self.child_questions = {
            "child_q1": "Communication - Verbal Expression",
            "child_q2": "Communication - Listening",
            "child_q3": "Social - Eye Contact",
            "child_q4": "Social - Peer Interaction",
            "child_q5": "Behavior - Emotional Regulation",
            "child_q6": "Behavior - Routine Flexibility",
        }
        self.parent_questions = {
            "parent_q1": "Home Behavior - Cooperation",
            "parent_q2": "Home Behavior - Daily Living Skills",
            "parent_q3": "Home Behavior - Sleep & Routine",
        }
        self.all_questions = {**self.child_questions, **self.parent_questions}

    def load_models(self):
        """Load pre-trained models from disk."""
        try:
            clf_path = os.path.join(self.model_dir, "classifier.joblib")
            reg_path = os.path.join(self.model_dir, "regressor.joblib")
            imp_path = os.path.join(self.model_dir, "imputer.joblib")
            cols_path = os.path.join(self.model_dir, "feature_columns.joblib")
            
            if all(os.path.exists(p) for p in [clf_path, reg_path, imp_path, cols_path]):
                self.classifier = joblib.load(clf_path)
                self.regressor = joblib.load(reg_path)
                self.imputer = joblib.load(imp_path)
                self.feature_cols = joblib.load(cols_path)
                print("✅ Models loaded successfully")
                return True
            else:
                print("⚠️ Model files not found. Please train models first.")
                return False
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False

    def engineer_features(self, data):
        """
        Engineer snapshot features from progress data.
        Input: dict with questions and demographic info
        Output: DataFrame with engineered features
        """
        df = pd.DataFrame([data])
        
        # Child vs parent averages
        child_qs = [q for q in self.child_questions.keys() if q in df.columns]
        parent_qs = [q for q in self.parent_questions.keys() if q in df.columns]
        
        if child_qs:
            df["child_avg"] = df[child_qs].mean(axis=1)
        if parent_qs:
            df["parent_avg"] = df[parent_qs].mean(axis=1)
        
        if "child_avg" in df.columns and "parent_avg" in df.columns:
            df["parent_child_gap"] = abs(df["child_avg"] - df["parent_avg"])
        
        # Score consistency
        all_qs = [q for q in self.all_questions.keys() if q in df.columns]
        if all_qs:
            df["score_consistency"] = df[all_qs].std(axis=1)
        
        # Skill area averages
        for area, cols in self.skill_areas.items():
            area_cols = [c for c in cols if c in df.columns]
            if area_cols:
                df[f"area_{area.lower()}"] = df[area_cols].mean(axis=1)
        
        # Weakest/strongest area
        area_cols = [f"area_{a.lower()}" for a in self.skill_areas.keys() if f"area_{a.lower()}" in df.columns]
        if area_cols:
            df["weakest_area_score"] = df[area_cols].min(axis=1)
            df["strongest_area_score"] = df[area_cols].max(axis=1)
            df["area_range"] = df["strongest_area_score"] - df["weakest_area_score"]
            df["weakest_area"] = df[area_cols].idxmin(axis=1).str.replace("area_", "")
        
        # Role averages
        for role in ['teacher', 'doctor', 'parent']:
            role_cols = [c for c in df.columns if c.startswith(f"{role}_")]
            if role_cols:
                df[f"role_{role}_avg"] = df[role_cols].mean(axis=1)
                if "child_avg" in df.columns:
                    df[f"role_{role}_child_gap"] = (df[f"role_{role}_avg"] - df["child_avg"]).abs()
        
        # Gender encoding
        if "gender" in df.columns:
            df["gender_enc"] = (df["gender"] == "M").astype(int)
        
        return df

    def predict(self, progress_data):
        """
        Make prediction for a child based on progress data.
        
        Args:
            progress_data (dict): Contains questions, age, gender, prev_week_score, etc.
        
        Returns:
            dict: Prediction results with improvement probability and score change
        """
        if not all([self.classifier, self.regressor, self.imputer, self.feature_cols]):
            return {"error": "Models not loaded"}
        
        try:
            # Engineer features from input data
            df = self.engineer_features(progress_data)
            
            # Get feature values, filling missing with 0
            X = df[self.feature_cols].fillna(0)
            
            # Apply imputer
            X_imputed = self.imputer.transform(X)
            
            # Make predictions
            improvement_pred = self.classifier.predict(X)[0]
            improvement_prob = self.classifier.predict_proba(X)[0][1]
            score_change = self.regressor.predict(X_imputed)[0]
            
            # Determine risk level
            avg_score = progress_data.get("weekly_overall_score", 3.0)
            is_at_risk = (improvement_pred == 0) or (avg_score < 2.5)
            
            return {
                "success": True,
                "improvement": bool(improvement_pred),
                "improvement_probability": float(improvement_prob),
                "predicted_score_change": float(score_change),
                "at_risk": is_at_risk,
                "weakest_area": df["weakest_area"].values[0] if "weakest_area" in df.columns else "Unknown",
                "confidence": "High" if improvement_prob > 0.7 or improvement_prob < 0.3 else "Medium"
            }
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return {"error": str(e)}

    def batch_predict(self, children_data):
        """Make predictions for multiple children."""
        results = []
        for child_data in children_data:
            result = self.predict(child_data)
            result["child_id"] = child_data.get("child_id")
            results.append(result)
        return results
