import { useState, useEffect } from 'react';
import { getOrCreateWeeklyProgress, getWeeklyProgress, submitParentWeeklyProgress, generateWeeklyPrediction } from '../services/dataService';
import PredictionAPI from '../services/predictionAPI';
import PredictionResult from './PredictionResult';

function WeeklyParentBehaviorForm({ child, parentId, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [weekProgress, setWeekProgress] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [showPrediction, setShowPrediction] = useState(false);
  const [generatingPrediction, setGeneratingPrediction] = useState(false);

  const [form, setForm] = useState({
    meltdowns: 0,
    sleep: 3,
    appetite: 3,
    highlight: '',
    observations: '',
  });

  // Load existing progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('🔄 Loading weekly progress for child:', child?.id);
        setLoading(true);
        
        if (!child?.id) {
          console.warn('⚠️ Child ID missing');
          setLoading(false);
          return;
        }
        
        const progress = await getOrCreateWeeklyProgress(child.id);
        console.log('📊 Loaded progress:', progress);
        
        setWeekProgress(progress);
        setSubmitted(!!progress?.parentProgress);
        setError('');
      } catch (err) {
        console.error('❌ Error loading progress:', err);
        setError(err.message || 'Failed to load progress');
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [child?.id]);

  const handleSave = async () => {
    try {
      console.log('💾 Saving parent progress...');
      console.log('  Child ID:', child?.id);
      console.log('  Parent ID:', parentId);
      console.log('  Form data:', form);
      
      if (!child?.id || !parentId) {
        setError('Missing child ID or parent ID');
        console.error('❌ Missing required IDs:', { childId: child?.id, parentId });
        return;
      }
      
      setSaving(true);
      setError('');

      const progressData = {
        ...form,
      };

      const result = await submitParentWeeklyProgress(child.id, progressData, parentId);
      console.log('✅ Save successful:', result);

      setSubmitted(true);
      setOpen(false);

      // Reload progress
      const updatedProgress = await getWeeklyProgress(child.id);
      setWeekProgress(updatedProgress);

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
      console.error('❌ Error saving progress:', err);
      setError(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-modern p-8 rounded-[3rem] border border-white/20 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-modern p-8 rounded-[3rem] border border-white/40 bg-white/40">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
          📝
        </div>
        <div>
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">Weekly Behavior Summary</h3>
          <p className="text-sm font-medium text-gray-500 italic">
            {submitted ? '✓ Submitted this week' : 'Quick weekly observations for your care team.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm mb-4">
          ⚠️ {error}
        </div>
      )}

      {submitted ? (
        <div className="space-y-4">
          <div className="p-6 bg-emerald-50 border-2 border-emerald-200 rounded-2xl text-center">
            <p className="text-lg font-bold text-emerald-800 flex items-center justify-center gap-2">
              <span className="text-2xl">✓</span>
              Weekly progress submitted!
            </p>
            <p className="text-sm text-emerald-600 mt-2">
              Waiting for teacher and doctor to submit their observations.
            </p>
          </div>
          {showPrediction && prediction && (
            <PredictionResult 
              progressData={prediction} 
              onClose={() => setShowPrediction(false)}
            />
          )}
          {generatingPrediction && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-sm font-bold text-blue-700">🤖 Generating AI prediction...</p>
            </div>
          )}
        </div>
      ) : (
        <>
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="w-full p-6 bg-blue-50 border-2 border-blue-200 text-blue-700 font-bold rounded-2xl hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="text-xl">➕</span>
              Submit This Week's Observations
            </button>
          ) : (
            <div className="space-y-6 bg-white/50 p-6 rounded-2xl border border-white/80">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">
                    Meltdowns
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          meltdowns: Math.max(0, prev.meltdowns - 1),
                        }))
                      }
                      className="w-10 h-10 rounded-xl glass hover:bg-white border border-gray-100 shadow-sm font-bold active:scale-95 transition-all"
                    >
                      −
                    </button>
                    <span className="text-2xl font-black text-gray-800 w-8 text-center">
                      {form.meltdowns}
                    </span>
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          meltdowns: prev.meltdowns + 1,
                        }))
                      }
                      className="w-10 h-10 rounded-xl glass hover:bg-white border border-gray-100 shadow-sm font-bold active:scale-95 transition-all text-blue-600"
                    >
                      +
                    </button>
                  </div>
                </div>

                {[
                  { key: 'sleep', label: 'Sleep Quality', icon: '🌙' },
                  { key: 'appetite', label: 'Appetite', icon: '🍎' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">
                      {item.label}
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button
                          key={v}
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              [item.key]: v,
                            }))
                          }
                          className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${
                            form[item.key] === v
                              ? 'bg-blue-600 text-white shadow-lg scale-110'
                              : 'bg-white text-gray-400 hover:bg-blue-50 border border-gray-200'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">
                    Today's Highlight
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Used eye contact"
                    value={form.highlight}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        highlight: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-bold focus:ring-2 focus:ring-blue-400 transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block mb-3">
                  Weekly Observations
                </label>
                <textarea
                  placeholder="Any new behaviors, concerns, or specific victories this week? Any patterns you've noticed?"
                  value={form.observations}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      observations: e.target.value,
                    }))
                  }
                  className="w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-400 transition-all shadow-sm min-h-[100px] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs px-10 py-4 rounded-2xl transition-all uppercase tracking-widest ${
                    saving
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:shadow-[0_10px_25px_-5px_rgba(14,165,233,0.4)] active:scale-95'
                  }`}
                >
                  {saving ? '⏳ Submitting...' : '✓ Submit Weekly Data'}
                </button>
                <button
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="px-6 py-4 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-50 transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WeeklyParentBehaviorForm;
