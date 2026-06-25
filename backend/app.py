"""
Flask API for autism children progress prediction model.
Provides endpoints for making predictions based on weekly progress data.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from prediction_service import PredictionService
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize prediction service with absolute path to models
backend_dir = os.path.dirname(os.path.abspath(__file__))
models_dir = os.path.join(backend_dir, "models")
prediction_service = PredictionService(model_dir=models_dir)

# Load models on startup
@app.before_request
def load_models():
    if not prediction_service.classifier:
        prediction_service.load_models()

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "models_loaded": prediction_service.classifier is not None
    })

@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict child progress based on weekly data.
    
    Expected JSON:
    {
        "child_id": "C001",
        "age": 5,
        "gender": "M",
        "week": 10,
        "child_q1": 3,
        "child_q2": 4,
        "child_q3": 2,
        "child_q4": 3,
        "child_q5": 4,
        "child_q6": 3,
        "parent_q1": 3,
        "parent_q2": 4,
        "parent_q3": 3,
        "teacher_communication_in_class": 3,
        "teacher_participation": 4,
        "doctor_overall_assessment": 3,
        "prev_week_score": 3.2,
        "weekly_overall_score": 3.4
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        result = prediction_service.predict(data)
        
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Make predictions for multiple children at once.
    
    Expected JSON:
    {
        "children": [
            { child_data_1 },
            { child_data_2 },
            ...
        ]
    }
    """
    try:
        data = request.json
        
        if not data or "children" not in data:
            return jsonify({"error": "Invalid batch format"}), 400
        
        results = prediction_service.batch_predict(data["children"])
        
        return jsonify({
            "success": True,
            "count": len(results),
            "predictions": results
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/model-info", methods=["GET"])
def model_info():
    """Get information about loaded models."""
    return jsonify({
        "classifier": "Random Forest" if prediction_service.classifier else "Not loaded",
        "regressor": "Gradient Boosting" if prediction_service.regressor else "Not loaded",
        "feature_count": len(prediction_service.feature_cols) if prediction_service.feature_cols else 0,
        "skill_areas": list(prediction_service.skill_areas.keys()),
        "questions": prediction_service.all_questions
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("DEBUG", "False") == "True"
    app.run(host="0.0.0.0", port=port, debug=debug)
