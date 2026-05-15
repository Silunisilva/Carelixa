import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { mchatQuestions, calculateMCHATScore } from '../data/mchatQuestions';

function MCHATScreening() {
  const [answers, setAnswers] = useState(Array(20).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

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

  const handleSaveForLater = () => {
    const data = {
      timestamp: new Date().toISOString(),
      answers,
      score: result?.score,
      riskLevel: result?.riskLevel,
      questionsAnswered: answers.filter(a => a !== null).length,
      totalQuestions: mchatQuestions.length
    };

    console.log('M-CHAT Screening Data (Save for Later):', data);
    setShowSaveConfirm(true);

    // Reset confirmation after 3 seconds
    setTimeout(() => setShowSaveConfirm(false), 3000);
  };

  const handleDownloadPDF = () => {
    const data = {
      timestamp: new Date().toISOString(),
      answers,
      result,
      questions: mchatQuestions
    };

    console.log('M-CHAT Assessment Report:', data);
    alert('PDF download would be implemented here. Check console for data.');
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all answers?')) {
      setAnswers(Array(20).fill(null));
      setSubmitted(false);
      setResult(null);
    }
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const progressPercentage = (answeredCount / 20) * 100;

  return (
    <DashboardLayout title="M-CHAT Screening Assessment">
      <div className="max-w-4xl mx-auto pb-10">
        {!submitted ? (
          <div className="space-y-6">
            {/* Header Section */}
            <section className="glass-modern p-8 rounded-[2.5rem] border border-white/30 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)]">
              <div className="flex items-start justify-between gap-6 mb-4">
                <div>
                  <h1 className="text-4xl font-black text-gray-800 tracking-tight leading-none mb-2">
                    M-CHAT Screening Assessment
                  </h1>
                  <p className="text-gray-600 font-medium max-w-2xl">
                    Please answer the following questions based on your child's typical behavior and development. This screening tool helps identify potential developmental concerns.
                  </p>
                </div>
                <div className="text-5xl">📋</div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
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
            </section>

            {/* Questions Section */}
            <section className="space-y-4">
              {mchatQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="glass-modern p-6 rounded-2xl border border-white/20 hover:border-white/40 transition-all"
                >
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                        {index + 1}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-medium mb-4 leading-relaxed">{question.text}</p>

                      <div className="flex gap-6">
                        {['Yes', 'No'].map((option) => (
                          <label key={option} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              checked={answers[index] === option}
                              onChange={() => handleAnswerChange(index, option)}
                              className="hidden"
                            />
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              answers[index] === option
                                ? 'border-blue-600 bg-blue-600'
                                : 'border-gray-300 group-hover:border-blue-400'
                            }`}>
                              {answers[index] === option && (
                                <div className="w-2 h-2 bg-white rounded-full" />
                              )}
                            </div>
                            <span className={`font-bold text-sm transition-colors ${
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
            </section>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              <button
                onClick={handleSubmit}
                disabled={!allQuestionsAnswered}
                className={`flex-1 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transform transition-all ${
                  allQuestionsAnswered
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-[0_10px_25px_-5px_rgba(14,165,233,0.4)] active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                ✓ Submit Assessment
              </button>

              <button
                onClick={handleReset}
                className="px-6 py-4 rounded-2xl font-bold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        ) : (
          /* Results Section */
          <div className="space-y-6 animate-fadeIn">
            {/* Result Card */}
            <div className={`glass-modern p-10 rounded-[2.5rem] border-2 overflow-hidden relative ${
              result.riskLevel === 'Low Risk'
                ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-teal-50/50'
                : result.riskLevel === 'Medium Risk'
                ? 'border-amber-200 bg-gradient-to-br from-amber-50/50 to-orange-50/50'
                : 'border-red-200 bg-gradient-to-br from-red-50/50 to-pink-50/50'
            }`}>
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <div className="text-9xl">
                  {result.riskLevel === 'Low Risk' ? '✨' : result.riskLevel === 'Medium Risk' ? '⚠️' : '🚨'}
                </div>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-4xl font-black text-white shadow-lg ${
                    result.riskLevel === 'Low Risk'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : result.riskLevel === 'Medium Risk'
                      ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                      : 'bg-gradient-to-br from-red-500 to-pink-600'
                  }`}>
                    {result.score}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">M-CHAT Score</p>
                    <h2 className="text-3xl font-black text-gray-800 leading-none">{result.riskLevel}</h2>
                  </div>
                </div>

                <div className="p-6 bg-white/60 rounded-2xl border border-white/80 mb-6">
                  <p className="text-gray-800 font-medium leading-relaxed mb-3">{result.riskDetails.description}</p>
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-xl flex-shrink-0">💡</span>
                    <span className="text-sm font-bold text-blue-900">{result.riskDetails.recommendation}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-white/60 rounded-xl text-center border border-white/80">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Risk Items</p>
                    <p className="text-2xl font-black text-gray-800">{result.score}</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl text-center border border-white/80">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Questions</p>
                    <p className="text-2xl font-black text-gray-800">{result.answeredQuestions}</p>
                  </div>
                  <div className="p-4 bg-white/60 rounded-xl text-center border border-white/80">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                    <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save and Actions */}
            <div className="glass-modern p-8 rounded-2xl border border-white/20">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                💾 Save Your Assessment
              </h3>
              <p className="text-gray-600 font-medium mb-6">
                Store this screening result for future reference and share with your care team.
              </p>

              {showSaveConfirm && (
                <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <span className="text-2xl">✓</span>
                  <p className="font-bold text-emerald-900">Assessment saved! Check console for data.</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleSaveForLater}
                  className="flex-1 px-6 py-3 bg-white hover:bg-blue-50 border-2 border-blue-600 text-blue-600 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  💾 Save Assessment
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  📥 Download Report
                </button>

                <button
                  onClick={() => {
                    setAnswers(Array(20).fill(null));
                    setSubmitted(false);
                    setResult(null);
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
                >
                  ↻ Start Over
                </button>
              </div>
            </div>

            {/* Q&A Section */}
            <div className="glass-modern p-8 rounded-2xl border border-white/20">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                ❓ Understanding Your Results
              </h3>

              <div className="space-y-4">
                <div className="p-4 bg-white/40 rounded-xl border border-white/60">
                  <p className="font-bold text-gray-800 mb-2">What does this screening mean?</p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    The M-CHAT is a widely-used screening tool for identifying children at risk for autism spectrum disorder. A single screening result should not be used as a diagnosis. If your child received a Medium or High Risk score, we recommend consulting with a developmental pediatrician or autism specialist for a comprehensive evaluation.
                  </p>
                </div>

                <div className="p-4 bg-white/40 rounded-xl border border-white/60">
                  <p className="font-bold text-gray-800 mb-2">What should I do next?</p>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Share this result with your child's pediatrician</li>
                    <li>Schedule a professional developmental evaluation if recommended</li>
                    <li>Document your child's developmental milestones</li>
                    <li>Keep regular follow-up screenings as advised</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <p className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                    📞 Need Help?
                  </p>
                  <p className="text-sm text-blue-800">
                    Consult with your healthcare provider or autism specialist to discuss these results and next steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default MCHATScreening;
