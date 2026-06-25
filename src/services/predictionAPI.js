/**
 * API Client for communicating with the ML prediction backend.
 * Handles all HTTP requests to the Flask API.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

class PredictionAPI {
  /**
   * Check if the backend is running and models are loaded.
   */
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error("Health check failed:", error);
      return { status: "error", models_loaded: false };
    }
  }

  /**
   * Get information about loaded models and available features.
   */
  static async getModelInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/model-info`);
      if (!response.ok) throw new Error("Failed to fetch model info");
      return await response.json();
    } catch (error) {
      console.error("Error fetching model info:", error);
      return null;
    }
  }

  /**
   * Make a prediction for a single child based on progress data.
   *
   * @param {Object} progressData - Child progress data including questions, scores, demographics
   * @returns {Promise<Object>} Prediction result with probability and recommendations
   */
  static async predictProgress(progressData) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Prediction failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Prediction error:", error);
      throw error;
    }
  }

  /**
   * Make predictions for multiple children at once.
   *
   * @param {Array} childrenData - Array of progress data objects
   * @returns {Promise<Object>} Batch prediction results
   */
  static async predictBatch(childrenData) {
    try {
      const response = await fetch(`${API_BASE_URL}/predict-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ children: childrenData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Batch prediction failed");
      }

      return await response.json();
    } catch (error) {
      console.error("Batch prediction error:", error);
      throw error;
    }
  }

  /**
   * Format progress data for API submission.
   * Converts form data to the format expected by the model.
   *
   * @param {Object} formData - Raw form data from components
   * @returns {Object} Formatted data ready for API
   */
  static formatProgressData(formData) {
    return {
      child_id: formData.childId,
      age: parseInt(formData.age),
      gender: formData.gender,
      week: parseInt(formData.week),
      child_q1: parseInt(formData.childQ1) || 3,
      child_q2: parseInt(formData.childQ2) || 3,
      child_q3: parseInt(formData.childQ3) || 3,
      child_q4: parseInt(formData.childQ4) || 3,
      child_q5: parseInt(formData.childQ5) || 3,
      child_q6: parseInt(formData.childQ6) || 3,
      parent_q1: parseInt(formData.parentQ1) || 3,
      parent_q2: parseInt(formData.parentQ2) || 3,
      parent_q3: parseInt(formData.parentQ3) || 3,
      teacher_communication_in_class: parseInt(formData.teacherCommunication) || 3,
      teacher_participation: parseInt(formData.teacherParticipation) || 3,
      doctor_overall_assessment: parseInt(formData.doctorAssessment) || 3,
      prev_week_score: parseFloat(formData.prevWeekScore) || 3.0,
      weekly_overall_score: parseFloat(formData.weeklyScore) || 3.0,
    };
  }
}

export default PredictionAPI;
