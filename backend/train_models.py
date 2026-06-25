"""
Setup script to extract and save trained models from the notebook.
Run this once to prepare models for the Flask API.
"""

import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.impute import SimpleImputer
import os

# Define feature columns (same as in notebook)
CHILD_QUESTIONS = {
    "child_q1": "Communication - Verbal Expression",
    "child_q2": "Communication - Listening",
    "child_q3": "Social - Eye Contact",
    "child_q4": "Social - Peer Interaction",
    "child_q5": "Behavior - Emotional Regulation",
    "child_q6": "Behavior - Routine Flexibility",
}

PARENT_QUESTIONS = {
    "parent_q1": "Home Behavior - Cooperation",
    "parent_q2": "Home Behavior - Daily Living Skills",
    "parent_q3": "Home Behavior - Sleep & Routine",
}

SKILL_AREAS = {
    "Communication": ["child_q1", "child_q2"],
    "Social": ["child_q3", "child_q4"],
    "Behavioral": ["child_q5", "child_q6"],
    "Home": ["parent_q1", "parent_q2", "parent_q3"],
}

FEATURE_COLS = (
    list(CHILD_QUESTIONS.keys()) +
    list(PARENT_QUESTIONS.keys()) +
    [
        "age", "gender_enc", "week",
        "prev_week_score",
        "child_avg", "parent_avg", "parent_child_gap",
        "score_consistency",
        "area_communication", "area_social", "area_behavioral", "area_home",
        "weakest_area_score", "strongest_area_score", "area_range",
        "role_teacher_avg", "role_doctor_avg", "role_parent_avg",
        "role_teacher_child_gap", "role_doctor_child_gap", "role_parent_child_gap",
    ]
)

def save_trained_models(classifier, regressor, imputer):
    """
    Save trained models to disk for use by Flask API.
    
    Args:
        classifier: Trained RandomForestClassifier
        regressor: Trained GradientBoostingRegressor
        imputer: SimpleImputer for handling missing values
    """
    model_dir = "models"
    os.makedirs(model_dir, exist_ok=True)
    
    try:
        joblib.dump(classifier, os.path.join(model_dir, "classifier.joblib"))
        joblib.dump(regressor, os.path.join(model_dir, "regressor.joblib"))
        joblib.dump(imputer, os.path.join(model_dir, "imputer.joblib"))
        joblib.dump(FEATURE_COLS, os.path.join(model_dir, "feature_columns.joblib"))
        
        print("✅ Models saved successfully:")
        print(f"   - classifier.joblib")
        print(f"   - regressor.joblib")
        print(f"   - imputer.joblib")
        print(f"   - feature_columns.joblib")
        return True
    except Exception as e:
        print(f"❌ Error saving models: {e}")
        return False

def load_and_prepare_data(csv_path):
    """Load and prepare data from the notebook's CSV output."""
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded {len(df)} rows")
    return df

# Instructions for use:
print("""
╔════════════════════════════════════════════════════════════════╗
║  Model Setup Instructions                                      ║
╚════════════════════════════════════════════════════════════════╝

1. Run the notebook (02_model_building_fixed.ipynb) to completion
   This will generate:
   - autism_children_dataset_with_features.csv
   - autism_children_predictions.csv

2. After the notebook completes, run this script in Python:
   
   from train_models import *
   import jupyter
   
   # Extract models from notebook outputs
   # (This requires manually copying the trained models)

3. OR manually save the models from the notebook:
   
   # In the notebook's last cell, add:
   import joblib
   joblib.dump(clf, 'models/classifier.joblib')
   joblib.dump(reg, 'models/regressor.joblib')
   joblib.dump(imputer, 'models/imputer.joblib')
   joblib.dump(FEATURE_COLS, 'models/feature_columns.joblib')

4. Then start the Flask server:
   cd backend
   pip install -r requirements.txt
   python app.py

5. Test the API:
   curl -X GET http://localhost:5000/health
""")
