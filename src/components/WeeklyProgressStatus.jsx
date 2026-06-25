import { useEffect, useState } from 'react';
import { getWeeklyProgressStatus } from '../services/dataService';
import PredictionResult from './PredictionResult';

function WeeklyProgressStatus({ childId, role }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrediction, setShowPrediction] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        console.log('📊 Loading weekly status for child:', childId, 'role:', role);
        setLoading(true);
        const data = await getWeeklyProgressStatus(childId);
        console.log('✅ Status loaded:', data);
        setStatus(data);
      } catch (err) {
        console.error('❌ Error loading weekly status:', err);
      } finally {
        setLoading(false);
      }
    };

    if (childId) {
      loadStatus();
      // Refresh every 30 seconds
      const interval = setInterval(loadStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [childId]);

  if (loading || !status) return null;

  const { submittedCount, parentSubmitted, teacherSubmitted, doctorSubmitted, prediction } = status;
  const allSubmitted = submittedCount === 3;

  return (
    <div className="glass-modern p-6 rounded-2xl border border-white/20">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-800">📊 Weekly Team Progress</h3>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            allSubmitted 
              ? 'bg-emerald-100 text-emerald-700'
              : submittedCount > 0
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {submittedCount}/3 Submitted
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-indigo-500"
            style={{ width: `${(submittedCount / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Status Checklist */}
      <div className="space-y-2 mb-6 p-4 bg-white/40 rounded-xl">
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
            parentSubmitted ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            {parentSubmitted ? '✓' : ''}
          </span>
          <span className={parentSubmitted ? 'text-gray-700 font-bold' : 'text-gray-500'}>
            Parent Progress
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
            teacherSubmitted ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            {teacherSubmitted ? '✓' : ''}
          </span>
          <span className={teacherSubmitted ? 'text-gray-700 font-bold' : 'text-gray-500'}>
            Teacher Progress
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
            doctorSubmitted ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-gray-500'
          }`}>
            {doctorSubmitted ? '✓' : ''}
          </span>
          <span className={doctorSubmitted ? 'text-gray-700 font-bold' : 'text-gray-500'}>
            Doctor Progress
          </span>
        </div>
      </div>

      {/* User Status Message */}
      {role === 'parent' && parentSubmitted && !allSubmitted && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
          ✓ Your progress submitted! Waiting for {3 - submittedCount} more team members...
        </div>
      )}
      {role === 'teacher' && teacherSubmitted && !allSubmitted && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
          ✓ Your observations submitted! Waiting for {3 - submittedCount} more team members...
        </div>
      )}
      {role === 'doctor' && doctorSubmitted && !allSubmitted && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 mb-4">
          ✓ Your clinical assessment submitted! Waiting for {3 - submittedCount} more team members...
        </div>
      )}
      {!parentSubmitted && role === 'parent' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
          ⏳ Please submit your weekly observations to proceed...
        </div>
      )}
      {!teacherSubmitted && role === 'teacher' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
          ⏳ Please submit your classroom observations to proceed...
        </div>
      )}
      {!doctorSubmitted && role === 'doctor' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 mb-4">
          ⏳ Please submit your clinical assessment to proceed...
        </div>
      )}

      {/* Prediction Results */}
      {allSubmitted && prediction && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl text-center">
            <p className="text-lg font-bold text-purple-800 flex items-center justify-center gap-2">
              <span className="text-2xl">🤖</span>
              AI Prediction Available
            </p>
            <p className="text-sm text-purple-600 mt-2">
              Based on all team submissions, an AI prediction has been generated.
            </p>
            <button
              onClick={() => setShowPrediction(!showPrediction)}
              className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-all"
            >
              {showPrediction ? '▼ Hide Prediction' : '▶ View AI Prediction'}
            </button>
          </div>
          {showPrediction && (
            <PredictionResult 
              progressData={prediction}
              onClose={() => setShowPrediction(false)}
            />
          )}
        </div>
      )}
      {allSubmitted && !prediction && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
          ✓ All submitted! Generating prediction...
        </div>
      )}
      {!allSubmitted && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 text-center">
          ⏳ Awaiting all team members to submit ({submittedCount}/3)
        </div>
      )}
    </div>
  );
}

export default WeeklyProgressStatus;
