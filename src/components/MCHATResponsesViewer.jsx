import { mchatQuestions } from '../data/mchatQuestions';

function MCHATResponsesViewer({ isOpen, onClose, child, mchatData }) {
  if (!isOpen || !child || !mchatData?.answers) return null;

  const getRiskColor = (answer, riskAnswer) => {
    if (answer === riskAnswer) {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-emerald-50 border-emerald-200';
  };

  const getRiskTextColor = (answer, riskAnswer) => {
    if (answer === riskAnswer) {
      return 'text-red-700';
    }
    return 'text-emerald-700';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-modern w-full max-w-4xl rounded-[2.5rem] border border-white/20 my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 px-8 py-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-800 mb-1">M-CHAT Assessment</h2>
            <p className="text-sm text-gray-600">Modified Checklist for Autism in Toddlers - {child.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
          >
            ✕
          </button>
        </div>

        {/* Score Summary */}
        <div className="px-8 py-6 border-b border-white/10 bg-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 rounded-2xl p-4 border border-white/80">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Score</p>
              <p className="text-3xl font-black text-gray-800">{mchatData.score}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${
              mchatData.riskLevel === 'Low Risk'
                ? 'bg-emerald-100 border-emerald-200'
                : mchatData.riskLevel === 'Medium Risk'
                ? 'bg-amber-100 border-amber-200'
                : 'bg-red-100 border-red-200'
            }`}>
              <p className={`text-xs font-bold uppercase mb-1 ${
                mchatData.riskLevel === 'Low Risk'
                  ? 'text-emerald-600'
                  : mchatData.riskLevel === 'Medium Risk'
                  ? 'text-amber-600'
                  : 'text-red-600'
              }`}>Risk Level</p>
              <p className={`text-2xl font-black ${
                mchatData.riskLevel === 'Low Risk'
                  ? 'text-emerald-700'
                  : mchatData.riskLevel === 'Medium Risk'
                  ? 'text-amber-700'
                  : 'text-red-700'
              }`}>{mchatData.riskLevel}</p>
            </div>
            <div className="bg-white/60 rounded-2xl p-4 border border-white/80">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">Assessment Date</p>
              <p className="text-sm font-bold text-gray-800">{new Date(mchatData.completedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="px-8 py-8 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
          {mchatQuestions.map((question, index) => {
            const answer = mchatData.answers[index];
            const isRisk = answer === question.riskAnswer;
            
            return (
              <div
                key={question.id}
                className={`p-5 rounded-2xl border transition-all ${
                  getRiskColor(answer, question.riskAnswer)
                }`}
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center font-bold text-gray-700">
                      {question.id}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-700 font-medium mb-3">{question.text}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Answer: <span className={`font-bold ${getRiskTextColor(answer, question.riskAnswer)}`}>{answer}</span>
                      </span>
                      {isRisk && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                          🚩 Risk Indicator
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/20 bg-white/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MCHATResponsesViewer;
