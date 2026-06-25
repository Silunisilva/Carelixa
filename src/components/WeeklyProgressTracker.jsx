import { useState, useEffect } from 'react';
import { getOrCreateWeeklyProgress, getWeeklyProgress, submitTeacherWeeklyProgress, submitDoctorWeeklyProgress, generateWeeklyPrediction } from '../services/dataService';
import PredictionResult from './PredictionResult';

const DEFAULT_METRICS = [
  { key: 'communication', label: 'Communication' },
  { key: 'eyeContact', label: 'Eye Contact' },
  { key: 'following', label: 'Following Instructions' },
  { key: 'focus', label: 'Focus Duration' },
  { key: 'social', label: 'Social Interaction' },
  { key: 'emotional', label: 'Emotional Regulation' },
];

function WeeklyProgressTracker({ child, role, onSubmit, customMetrics, userId }) {
  const metrics = customMetrics || DEFAULT_METRICS;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [weekProgress, setWeekProgress] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);

  const [form, setForm] = useState(() => {
    const initial = {};
    metrics.forEach((m) => (initial[m.key] = 3));
    initial.notes = '';
    return initial;
  });

  // Load existing progress for this week
  useEffect(() => {
    const loadProgress = async () => {
      try {
        setLoading(true);
        const progress = await getOrCreateWeeklyProgress(child.id);
        setWeekProgress(progress);

        // Check if current role already submitted
        const hasSubmitted =
          (role === 'teacher' && progress.teacherProgress) ||
          (role === 'doctor' && progress.doctorProgress);

        setSubmitted(hasSubmitted);
        setError('');
      } catch (err) {
        console.error('Error loading progress:', err);
        setError('Failed to load progress');
      } finally {
        setLoading(false);
      }
    };

    if (child?.id) {
      loadProgress();
    }
  }, [child?.id, role]);

  // Reinitialize form if metrics change
  useEffect(() => {
    const initial = {};
    metrics.forEach((m) => (initial[m.key] = 3));
    initial.notes = '';
    setForm(initial);
  }, [metrics]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');

      if (!userId) {
        setError('User ID not available');
        setSaving(false);
        return;
      }

      console.log('💾 Saving', role, 'progress for user:', userId);

      const progressData = {
        metrics: metrics.reduce(
          (acc, m) => ({ ...acc, [m.key]: Number(form[m.key]) }),
          {}
        ),
        notes: form.notes || '',
      };

      if (role === 'teacher') {
        await submitTeacherWeeklyProgress(child.id, progressData, userId);
      } else if (role === 'doctor') {
        await submitDoctorWeeklyProgress(child.id, progressData, userId);
      }

      setSubmitted(true);
      setOpen(false);

      // Reload progress to show updated status
      const updatedProgress = await getWeeklyProgress(child.id);
      setWeekProgress(updatedProgress);

      console.log('✅ Progress saved successfully');

      // Check if all three roles have submitted
      if (updatedProgress?.parentProgress && updatedProgress?.teacherProgress && updatedProgress?.doctorProgress) {
        console.log('🤖 All roles submitted! Generating AI prediction...');
        setGeneratingPrediction(true);
        try {
          const pred = await generateWeeklyPrediction(child.id);
          console.log('📊 Prediction response:', pred);
          
          // Check for error response
          if (!pred || pred.error) {
            console.error('❌ Prediction error:', pred?.error);
            setGeneratingPrediction(false);
            return;
          }
          
          // Prediction was successful (backend returns object with prediction data)
          setPrediction(pred);
          setShowPrediction(true);
          console.log('✅ Prediction generated:', pred);
        } catch (err) {
          console.error('❌ Error generating prediction:', err);
        } finally {
          setGeneratingPrediction(false);
        }
      }

      if (typeof onSubmit === 'function') {
        onSubmit();
      }
    } catch (err) {
      console.error('Error saving progress:', err);
      setError(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-6 rounded-xl animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-modern p-6 rounded-2xl border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          🎯 Weekly Progress ({role})
        </h3>
        <div className="space-x-2">
          {submitted ? (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
              ✓ Submitted
            </span>
          ) : (
            <button
              onClick={() => setOpen((s) => !s)}
              className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-all"
            >
              {open ? 'Close' : 'Add Update'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {submitted && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
          <p className="text-sm text-emerald-800 font-medium">
            ✓ Your progress has been submitted for this week!
          </p>
        </div>
      )}

      {open && !submitted && (
        <div className="bg-white/50 p-4 rounded-lg border border-white/80">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {metrics.map((m) => (
              <div key={m.key}>
                <label className="block text-sm text-gray-700 font-bold mb-2">
                  {m.label} (1-5)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={form[m.key]}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        [m.key]: Number(e.target.value),
                      }))
                    }
                    className="flex-1 cursor-pointer"
                  />
                  <span className="text-sm font-bold text-gray-800 w-8 text-right">
                    {form[m.key]} / 5
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-700 font-bold mb-2">
              Observations & Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              placeholder="Add any specific observations, concerns, or achievements..."
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
              rows={4}
            ></textarea>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-4 py-2 rounded-lg font-bold text-white transition-all ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 active:scale-95'
              }`}
            >
              {saving ? 'Saving...' : 'Submit Progress'}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all font-bold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary Display */}
      {weekProgress && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {metrics.slice(0, 3).map((m) => (
            <div key={m.key} className="p-3 bg-white/40 rounded-lg">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">{m.label}</p>
              <p className="text-lg font-black text-gray-800">—</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {submitted ? 'Submitted' : 'Pending'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WeeklyProgressTracker;
