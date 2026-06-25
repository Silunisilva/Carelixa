import React, { useEffect, useState } from "react";
import PredictionAPI from "../services/predictionAPI";

/**
 * Component to display AI predictions about child progress.
 * Shows improvement probability, at-risk status, and recommendations.
 */
const PredictionResult = ({ progressData, onClose }) => {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoading(false);
      
      // progressData should already be the stored prediction object from Firestore
      // It has fields: improvement, improvement_probability, at_risk, weakest_area, confidence, etc.
      if (progressData && typeof progressData === 'object') {
        setPrediction(progressData);
        setError(null);
      } else {
        setError('No prediction data available');
      }
    } catch (err) {
      setError(err.message);
      console.error("Prediction error:", err);
    }
  }, [progressData]);

  if (loading) {
    return (
      <div className="prediction-container loading">
        <div className="spinner"></div>
        <p>Analyzing child progress data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="prediction-container error">
        <div className="error-icon">⚠️</div>
        <h3>Prediction Unavailable</h3>
        <p>{error}</p>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    );
  }

  if (!prediction || prediction.error) {
    return (
      <div className="prediction-container">
        <p>No prediction available</p>
      </div>
    );
  }

  const {
    improvement,
    improvement_probability,
    predicted_score_change,
    at_risk,
    weakest_area,
    confidence,
  } = prediction;

  const probabilityPercent = Math.round(improvement_probability * 100);
  const statusColor = improvement ? "#2ecc71" : "#e74c3c";
  const statusText = improvement ? "Likely to Improve" : "At Risk of Decline";

  return (
    <div className="prediction-container">
      <div className="prediction-header">
        <h2>🤖 AI Progress Prediction</h2>
        <button onClick={onClose} className="close-btn">
          ×
        </button>
      </div>

      <div className="prediction-main" style={{ borderLeftColor: statusColor }}>
        <div className="status-badge" style={{ backgroundColor: statusColor }}>
          {statusText}
        </div>

        <div className="prediction-stats">
          <div className="stat">
            <label>Improvement Probability</label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${probabilityPercent}%`,
                  backgroundColor: statusColor,
                }}
              ></div>
            </div>
            <span className="stat-value">{probabilityPercent}%</span>
          </div>

          <div className="stat">
            <label>Predicted Score Change</label>
            <span
              className="stat-value"
              style={{ color: predicted_score_change > 0 ? "#2ecc71" : "#e74c3c" }}
            >
              {predicted_score_change > 0 ? "+" : ""}
              {predicted_score_change.toFixed(2)}
            </span>
          </div>

          <div className="stat">
            <label>Confidence Level</label>
            <span className="stat-value">{confidence}</span>
          </div>

          {weakest_area && (
            <div className="stat">
              <label>Primary Focus Area</label>
              <span className="stat-value">{weakest_area}</span>
            </div>
          )}
        </div>

        {at_risk && (
          <div className="warning-box">
            <h4>⚠️ Alert: Child Flagged as At-Risk</h4>
            <p>
              This child may need additional intervention or support. Consider:
            </p>
            <ul>
              <li>Increased monitoring and check-ins</li>
              <li>Review and adjust current therapy approach</li>
              <li>Coordinate with parents/guardians for additional support</li>
              <li>
                Focus on identified weak area: <strong>{weakest_area}</strong>
              </li>
            </ul>
          </div>
        )}

        {improvement && !at_risk && (
          <div className="success-box">
            <h4>✅ Positive Progress Indicators</h4>
            <p>This child is showing good progress. Continue current approach.</p>
          </div>
        )}
      </div>

      <div className="prediction-footer">
        <button onClick={onClose} className="btn btn-primary">
          Close
        </button>
      </div>

      <style>{`
        .prediction-container {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          margin: 20px auto;
        }

        .prediction-container.loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 200px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f0f0f0;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .prediction-container.error {
          background: #fef5f5;
          border-left: 4px solid #e74c3c;
        }

        .error-icon {
          font-size: 40px;
          margin: 20px 0;
          text-align: center;
        }

        .prediction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 15px;
        }

        .prediction-header h2 {
          margin: 0;
          font-size: 20px;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
        }

        .close-btn:hover {
          color: #333;
        }

        .prediction-main {
          margin: 20px 0;
          padding: 15px;
          border-left: 4px solid #3498db;
          background: #f9f9f9;
          border-radius: 4px;
        }

        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          color: white;
          font-weight: bold;
          margin-bottom: 15px;
          font-size: 14px;
        }

        .prediction-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin: 20px 0;
        }

        .stat {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }

        .stat label {
          display: block;
          font-size: 12px;
          color: #666;
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
          margin: 8px 0;
        }

        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .warning-box {
          background: #fff3cd;
          border-left: 4px solid #e74c3c;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .warning-box h4 {
          margin: 0 0 10px 0;
          color: #d9534f;
          font-size: 14px;
        }

        .warning-box p {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #333;
        }

        .warning-box ul {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
        }

        .warning-box li {
          margin: 5px 0;
          color: #333;
        }

        .success-box {
          background: #d4edda;
          border-left: 4px solid #2ecc71;
          padding: 15px;
          border-radius: 4px;
          margin: 15px 0;
        }

        .success-box h4 {
          margin: 0 0 10px 0;
          color: #2ecc71;
          font-size: 14px;
        }

        .success-box p {
          margin: 0;
          font-size: 13px;
          color: #333;
        }

        .prediction-footer {
          margin-top: 20px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-primary {
          background: #3498db;
          color: white;
        }

        .btn-primary:hover {
          background: #2980b9;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }
      `}</style>
    </div>
  );
};

export default PredictionResult;
