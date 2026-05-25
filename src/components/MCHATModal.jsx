import { useState, useEffect } from 'react';
import { mchatQuestions, calculateMCHATScore } from '../data/mchatQuestions';
import { saveMCHATScore } from '../services/dataService';

function MCHATModal({ isOpen, onClose, child, onScoreSaved }) {
  const [answers, setAnswers] = useState(Array(20).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [savingToDb, setSavingToDb] = useState(false);
  const [previousScore, setPreviousScore] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Load previous score if it exists
  useEffect(() => {
    if (child?.mchatCompleted) {
      setPreviousScore({
        score: child.mchatScore,
        riskLevel: child.mchatRiskLevel,
      });
      setIsUpdating(true);
    } else {
      setIsUpdating(false);
      setPreviousScore(null);
    }
  }, [child?.mchatCompleted, child?.mchatScore]);

  if (!isOpen) return null;

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const allQuestionsAnswered = answers.every(answer => answer !== null);

  const handleSubmit = () => {
    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    const calculatedResult = calculateMCHATScore(answers);
    setResult(calculatedResult);
    setSubmitted(true);
  };

  const handleSaveScore = async () => {
    try {
      setSavingToDb(true);
      await saveMCHATScore(child.id, {
        score: result.score,
        riskLevel: result.riskLevel,
        answers,
      });
      setShowSaveConfirm(true);
      
      // Notify parent that score was saved
      if (onScoreSaved) {
        onScoreSaved({
          score: result.score,
          riskLevel: result.riskLevel,
        });
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        resetModal();
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Error saving M-CHAT score:', err);
      alert('Failed to save M-CHAT score. Please try again.');
    } finally {
      setSavingToDb(false);
    }
  };

  const handleRetake = () => {
    setAnswers(Array(20).fill(null));
    setSubmitted(false);
    setResult(null);
  };

  const resetModal = () => {
    setAnswers(Array(20).fill(null));
    setSubmitted(false);
    setResult(null);
    setShowSaveConfirm(false);
    setPreviousScore(null);
    setIsUpdating(false);
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercentage = (answeredCount / 20) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-modern w-full max-w-4xl rounded-[2.5rem] border border-white/20 my-8">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-black text-gray-800">M-CHAT Screening Assessment</h2>
            {child && <p className="text-sm text-gray-600 mt-1">for {child.name}</p>}
          </div>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-8 max-h-[80vh] overflow-y-auto">
          {!submitted ? (
            <div className="space-y-6">
              {/* Header with Previous Score */}
              {isUpdating && previousScore && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm font-bold text-blue-900 mb-1">📝 Updating Previous Assessment</p>
                  <p className="text-xs text-blue-700">Previous Score: <span className="font-black">{previousScore.riskLevel}</span> ({previousScore.score})</p>
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Your Progress</span>
                  <span className="text-sm font-bold text-gray-700">{answeredCount} of 20 questions answered</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {mchatQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="glass-modern p-4 rounded-xl border border-white/20 hover:border-white/40 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                        {index + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 font-medium mb-3">{question.text}</p>

                        <div className="flex gap-4">
                          {['Yes', 'No'].map((option) => (
                            <label key={option} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                checked={answers[index] === option}
                                onChange={() => handleAnswerChange(index, option)}
                                className="hidden"
                              />
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                                answers[index] === option
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-gray-300 group-hover:border-blue-400'
                              }`}>
                                {answers[index] === option && (
                                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                )}
                              </div>
                              <span className={`font-bold text-xs transition-colors ${
                                answers[index] === option ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-800'
                              }`}>
                                {option}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered}
                  className={`flex-1 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transform transition-all ${
                    allQuestionsAnswered
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg active:scale-95'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  ✓ Submit Assessment
                </button>

                <button
                  onClick={() => {
                    resetModal();
                    onClose();
                  }}
                  className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Results Section */
            <div className="space-y-4 animate-fadeIn">
              {/* Result Card */}
              <div className={`p-6 rounded-2xl border-2 overflow-hidden ${
                result.riskLevel === 'Low Risk'
                  ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50'
                  : result.riskLevel === 'Medium Risk'
                  ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50'
                  : 'border-red-200 bg-gradient-to-br from-red-50/50 to-pink-50/50'
              }`}>
                {isUpdating && previousScore && (
                  <div className="mb-4 p-3 bg-amber-50 border-l-4 border-amber-500 rounded">
                    <p className="text-xs font-bold text-amber-900 mb-1">📊 Score Update</p>
                    <div className="flex items-center justify-between text-[10px]">
                      <div>
                        <p className="text-gray-700">Previous: <span className="font-black text-amber-700">{previousScore.riskLevel}</span> ({previousScore.score})</p>
                      </div>
                      <span>→</span>
                      <div>
                        <p className="text-gray-700">New: <span className="font-black text-blue-700">{result.riskLevel}</span> ({result.score})</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-lg ${
                    result.riskLevel === 'Low Risk'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : result.riskLevel === 'Medium Risk'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    {result.score}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">M-CHAT Score</p>
                    <h2 className="text-2xl font-black text-gray-800 leading-none">{result.riskLevel}</h2>
                  </div>
                </div>

                <p className="text-sm text-gray-700 font-medium leading-relaxed">{result.riskDetails.description}</p>
              </div>

              {/* Save Confirmation */}
              {showSaveConfirm && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${
                  isUpdating
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-emerald-50 border border-emerald-200'
                }`}>
                  <span className="text-2xl">{isUpdating ? '🔄' : '✓'}</span>
                  <p className={`font-bold ${isUpdating ? 'text-blue-900' : 'text-emerald-900'}`}>
                    {isUpdating ? 'Assessment updated successfully!' : 'Assessment saved successfully!'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                {!showSaveConfirm ? (
                  <>
                    <button
                      onClick={handleSaveScore}
                      disabled={savingToDb}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {savingToDb ? '💾 Saving...' : '💾 Save Score'}
                    </button>

                    <button
                      onClick={handleRetake}
                      className="flex-1 px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-bold rounded-xl transition-all"
                    >
                      ↻ Retake Test
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      resetModal();
                      onClose();
                    }}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                  >
                    ✓ Close
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MCHATModal;
