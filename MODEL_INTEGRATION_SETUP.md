# 🤖 Model Integration Guide

This guide explains how to integrate the AI prediction model with your React application.

## 📂 Project Structure

```
autism-care/
├── backend/                          # Python ML backend
│   ├── app.py                        # Flask API server
│   ├── prediction_service.py         # Model prediction logic
│   ├── train_models.py               # Model setup instructions
│   ├── models/                       # Trained model artifacts (created after training)
│   │   ├── classifier.joblib
│   │   ├── regressor.joblib
│   │   ├── imputer.joblib
│   │   └── feature_columns.joblib
│   ├── requirements.txt              # Python dependencies
│   └── .env                          # Backend configuration
│
├── src/
│   ├── services/
│   │   ├── predictionAPI.js          # API client for React
│   │   └── dataService.js            # Existing data service
│   ├── components/
│   │   ├── PredictionResult.jsx      # New: Prediction display component
│   │   ├── WeeklyParentBehaviorForm.jsx  # Modified: Add prediction call
│   │   ├── WeeklyProgressStatus.jsx       # Modified: Add prediction display
│   │   └── ...
│   └── ...
│
├── .env.example                      # Example environment variables
├── package.json
└── vite.config.js
```

## 🚀 Setup Instructions

### Step 1: Prepare Your Model File

1. Move your notebook to the backend:
   ```bash
   cp 02_model_building_fixed.ipynb autism-care/backend/notebooks/
   ```

2. Run the notebook to completion to generate trained models

3. In the notebook's final cell, add code to save models:
   ```python
   import joblib
   
   # Save trained models
   joblib.dump(clf, 'models/classifier.joblib')
   joblib.dump(reg, 'models/regressor.joblib')
   joblib.dump(imputer, 'models/imputer.joblib')
   joblib.dump(FEATURE_COLS, 'models/feature_columns.joblib')
   
   print("✅ Models saved to backend/models/")
   ```

4. Or manually extract and save models by running:
   ```bash
   cd backend
   python train_models.py  # Instructions will be displayed
   ```

### Step 2: Set Up Python Backend

1. Install dependencies:
   ```bash
   cd autism-care/backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. Verify the models are in place:
   ```bash
   ls -la models/
   # Should show: classifier.joblib, regressor.joblib, imputer.joblib, feature_columns.joblib
   ```

3. Start the Flask server:
   ```bash
   python app.py
   ```
   
   Expected output:
   ```
   ✅ Models loaded successfully
   * Running on http://0.0.0.0:5000
   ```

### Step 3: Configure React App

1. Create `.env` file in project root with:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

2. Install any missing dependencies:
   ```bash
   npm install
   ```

### Step 4: Test the Connection

1. Run the React app:
   ```bash
   npm run dev
   ```

2. Test the API in browser console:
   ```javascript
   // Open browser console (F12 → Console tab)
   
   const response = await fetch('http://localhost:5000/health');
   const data = await response.json();
   console.log(data);
   // Expected: { status: "ok", models_loaded: true }
   ```

## 🔗 Integration Points

### 1. Parent/Teacher Adding Weekly Progress

When a role (parent, teacher, doctor) submits weekly progress, call the prediction API:

```jsx
import PredictionAPI from "../services/predictionAPI.js";
import PredictionResult from "../components/PredictionResult.jsx";

// In your form submission handler:
const handleSubmitProgress = async (formData) => {
  // 1. Save data to Firebase (existing code)
  await saveProgressToFirebase(formData);
  
  // 2. Get AI prediction
  const formatted = PredictionAPI.formatProgressData(formData);
  const prediction = await PredictionAPI.predictProgress(formatted);
  
  // 3. Display prediction result to user
  setShowPrediction(true);
  setPredictionData(prediction);
};

// In JSX:
{showPrediction && (
  <PredictionResult 
    progressData={predictionData}
    onClose={() => setShowPrediction(false)}
  />
)}
```

### 2. Using in WeeklyProgressStatus

Example integration in existing components:

```jsx
import PredictionResult from "./PredictionResult";
import PredictionAPI from "../services/predictionAPI";

function WeeklyProgressStatus() {
  const [prediction, setPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);

  const handleGetPrediction = async (childData) => {
    const formatted = PredictionAPI.formatProgressData(childData);
    const result = await PredictionAPI.predictProgress(formatted);
    setPrediction(result);
    setShowPrediction(true);
  };

  return (
    <div>
      {/* Existing progress display */}
      <button onClick={() => handleGetPrediction(currentChild)}>
        Get AI Prediction
      </button>

      {showPrediction && (
        <PredictionResult 
          progressData={prediction}
          onClose={() => setShowPrediction(false)}
        />
      )}
    </div>
  );
}
```

### 3. Batch Predictions for Dashboard

For doctor's dashboard showing all children:

```jsx
import PredictionAPI from "../services/predictionAPI";

async function getDashboardPredictions(allChildren) {
  const childrenData = allChildren.map(child => 
    PredictionAPI.formatProgressData(child)
  );
  
  const results = await PredictionAPI.predictBatch(childrenData);
  
  return results.predictions;
}
```

## 📊 API Endpoints

### Health Check
```
GET /health
Response: { status: "ok", models_loaded: true }
```

### Single Prediction
```
POST /predict
Body: {
  "child_id": "C001",
  "age": 5,
  "gender": "M",
  "week": 10,
  "child_q1": 3,
  "child_q2": 4,
  ...
}
Response: {
  "improvement": true,
  "improvement_probability": 0.78,
  "predicted_score_change": 0.45,
  "at_risk": false,
  "confidence": "High"
}
```

### Batch Prediction
```
POST /predict-batch
Body: { "children": [...] }
Response: { "predictions": [...], "count": N }
```

### Model Info
```
GET /model-info
Response: {
  "classifier": "Random Forest",
  "regressor": "Gradient Boosting",
  "feature_count": 36,
  "skill_areas": ["Communication", "Social", "Behavioral", "Home"],
  "questions": {...}
}
```

## 🔧 Troubleshooting

### Models not loading
```
Error: "Models not loaded"
```
**Solution**: Ensure model files are in `backend/models/`:
```bash
ls backend/models/
# Should show: classifier.joblib, regressor.joblib, imputer.joblib, feature_columns.joblib
```

### CORS errors in browser
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Flask-CORS is already configured in `app.py`. Ensure both servers are running:
- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`

### Port already in use
```
Address already in use
```
**Solution**: Kill the process or use a different port:
```bash
# Change PORT in backend/.env
PORT=5001
python app.py
```

### Connection refused
```
Failed to fetch: http://localhost:5000/health
```
**Solution**: Ensure Flask backend is running:
```bash
cd backend
source venv/bin/activate
python app.py
```

## 📝 Example: Complete Integration

Here's a complete example of integrating with `WeeklyParentBehaviorForm`:

```jsx
import { useState } from "react";
import PredictionAPI from "../services/predictionAPI";
import PredictionResult from "./PredictionResult";

export default function WeeklyParentBehaviorForm({ childId }) {
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to Firebase
      await saveToFirebase(formData);

      // 2. Get prediction
      const formatted = PredictionAPI.formatProgressData({
        childId,
        ...formData,
      });
      const result = await PredictionAPI.predictProgress(formatted);
      
      setPrediction(result);
      setShowPrediction(true);

      // Show success message
      alert("✅ Progress saved and analyzed!");
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        {/* Your form fields */}
        <button type="submit" disabled={loading}>
          {loading ? "Analyzing..." : "Submit & Get Prediction"}
        </button>
      </form>

      {showPrediction && (
        <PredictionResult 
          progressData={prediction}
          onClose={() => setShowPrediction(false)}
        />
      )}
    </div>
  );
}
```

## 📚 Additional Resources

- Model features documentation: See `backend/prediction_service.py`
- API client usage: See `src/services/predictionAPI.js`
- Prediction component: See `src/components/PredictionResult.jsx`
- Notebook: `backend/notebooks/02_model_building_fixed.ipynb`

## ✅ Deployment Checklist

- [ ] Models trained and saved to `backend/models/`
- [ ] Backend dependencies installed
- [ ] Flask app runs without errors
- [ ] `.env` file configured with correct API URL
- [ ] React app connects successfully to backend
- [ ] Predictions display correctly in components
- [ ] Error handling works (connection refused, invalid data, etc.)
- [ ] Ready for production deployment

---

**Next Steps**: 
1. Run the notebook to generate trained models
2. Copy models to `backend/models/` directory
3. Start Flask backend: `python backend/app.py`
4. Test connection with health check endpoint
5. Integrate API calls into React components
