# 🧠 Autism Care - ML Backend

Python Flask API server for autism children progress predictions.

## 📦 Contents

- **app.py** - Flask application with REST API endpoints
- **prediction_service.py** - ML model service for making predictions
- **train_models.py** - Setup instructions for model training
- **requirements.txt** - Python dependencies
- **models/** - Directory for trained model artifacts
- **notebooks/** - ML training notebooks

## 🚀 Quick Start

### 1. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Prepare Models
Place trained models in `models/` directory:
- `classifier.joblib` - Random Forest classifier
- `regressor.joblib` - Gradient Boosting regressor
- `imputer.joblib` - Data imputer
- `feature_columns.joblib` - Feature column list

See `train_models.py` for instructions on extracting models from notebook.

### 3. Start Server
```bash
python app.py
```

Server runs on `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Make Prediction
```bash
POST /predict
Content-Type: application/json

{
  "child_id": "C001",
  "age": 5,
  "gender": "M",
  "week": 10,
  "child_q1": 3,
  "child_q2": 4,
  ...
}
```

### Batch Predictions
```bash
POST /predict-batch
Content-Type: application/json

{
  "children": [
    { child_data_1 },
    { child_data_2 }
  ]
}
```

### Model Info
```bash
GET /model-info
```

## 📊 Input Format

Required fields for predictions:
- `child_id` - Child identifier
- `age` - Child age in years
- `gender` - "M" or "F"
- `week` - Week number
- `prev_week_score` - Previous week's score
- `weekly_overall_score` - Current week's score

Question scores (1-5 scale):
- `child_q1` to `child_q6` - Child assessment questions
- `parent_q1` to `parent_q3` - Parent assessment questions
- `teacher_*` - Teacher observations
- `doctor_*` - Doctor assessments

## 🔄 Workflow

1. React app sends progress data to `/predict` endpoint
2. API receives and validates data
3. `PredictionService` engineers features
4. Models make predictions
5. Results returned with probability and recommendations

## 🛠 Configuration

Edit `.env` to configure:
```env
FLASK_ENV=development
FLASK_DEBUG=True
PORT=5000
DEBUG=True
```

## 📝 Model Info

- **Classifier**: Random Forest (200 trees)
- **Regressor**: Gradient Boosting (200 estimators)
- **Accuracy**: ~71% on test set
- **Features**: 36 engineered features including:
  - Child/parent question responses
  - Demographic info (age, gender)
  - Skill area averages
  - Role-based assessments
  - Consistency metrics

## ❌ Troubleshooting

### ModuleNotFoundError
```
ModuleNotFoundError: No module named 'sklearn'
```
**Solution**: Ensure venv is activated and dependencies installed:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Models not loaded
```
Models not loaded
```
**Solution**: Verify model files exist:
```bash
ls models/
```

### Port already in use
```
Address already in use
```
**Solution**: Use different port:
```bash
PORT=5001 python app.py
```

## 📚 Files

| File | Purpose |
|------|---------|
| `app.py` | Flask API server |
| `prediction_service.py` | Prediction logic |
| `train_models.py` | Model setup guide |
| `requirements.txt` | Dependencies |
| `.env` | Configuration |
| `models/` | Model artifacts |
| `notebooks/` | ML training code |

## 🔐 Security Notes

- Never commit `.env` with sensitive data
- Use environment variables for configuration
- Validate all input data
- Set `DEBUG=False` in production
- Use HTTPS in production deployment

## 📄 License

Part of Autism Care application

---

For React integration details, see `../MODEL_INTEGRATION_SETUP.md`
