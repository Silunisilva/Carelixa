import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { mockChildren, mockDocuments, mockTimeline, mockAIPlans } from '../data/mockData';
import { getDoctorChildren, getMCHATScore } from '../services/dataService';
import ProgressTracker from '../components/ProgressTracker';

function randomHex(len = 16) {
  const chars = 'abcdef0123456789';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function DoctorDashboard() {
  const { currentUser } = useAuth();
  
  // Fetch children assigned to this doctor
  const [assignedChildren, setAssignedChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mchatScores, setMchatScores] = useState({});

  const [documents, setDocuments] = useState(mockDocuments);
  const [timeline, setTimeline] = useState(mockTimeline);

  const [tab, setTab] = useState('overview'); // overview, documents, upload, timeline, progress

  // filters for documents
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch children assigned to this doctor
  useEffect(() => {
    if (currentUser?.id) {
      loadDoctorChildren();
    }
  }, [currentUser?.id]);

  const loadDoctorChildren = async () => {
    try {
      setLoading(true);
      const children = await getDoctorChildren(currentUser.id);
      if (children.length > 0) {
        setAssignedChildren(children);
        setSelectedChild(children[0]);
        
        // Load M-CHAT scores for all children
        const scores = {};
        for (const child of children) {
          const mchatData = await getMCHATScore(child.id);
          if (mchatData) {
            scores[child.id] = mchatData;
          }
        }
        setMchatScores(scores);
      } else {
        // Fallback to mock data if no children in database
        const mockDoctorChildren = mockChildren.filter((c) => c.doctorId === 'doctor1');
        setAssignedChildren(mockDoctorChildren);
        setSelectedChild(mockDoctorChildren[0] || mockChildren[0]);
      }
    } catch (err) {
      console.error('Error loading doctor children:', err);
      // Fallback to mock data on error
      const mockDoctorChildren = mockChildren.filter((c) => c.doctorId === 'doctor1');
      setAssignedChildren(mockDoctorChildren);
      setSelectedChild(mockDoctorChildren[0] || mockChildren[0]);
    } finally {
      setLoading(false);
    }
  };

  const childDocuments = useMemo(() => {
    return documents.filter((d) => d.childId === selectedChild?.id)
      .filter((d) => (typeFilter === 'all' ? true : d.type === typeFilter))
      .filter((d) => (startDate ? d.uploadedDate >= startDate : true))
      .filter((d) => (endDate ? d.uploadedDate <= endDate : true));
  }, [documents, selectedChild, typeFilter, startDate, endDate]);

  const childTimeline = timeline.filter((t) => t.childId === selectedChild?.id);

  const handleFiles = useCallback((files) => {
    const now = new Date().toISOString().split('T')[0];
    const newDocs = Array.from(files).map((file) => {
      const hash = randomHex(64);
      const tx = '0x' + randomHex(64);
      return {
        id: Math.random().toString(36).substr(2, 9),
        childId: selectedChild?.id,
        type: 'Medical Report',
        title: file.name,
        uploadedBy: 'Dr. You',
        uploadedDate: now,
        url: '#',
        blockchainHash: hash,
        txHash: tx,
      };
    });
    setDocuments((d) => [...newDocs, ...d]);
    // also could push to timeline - simulated
  }, [selectedChild]);

  const onDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const onFileInput = (e) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const uniqueTypes = useMemo(() => {
    const set = new Set(documents.map((d) => d.type));
    return ['all', ...Array.from(set)];
  }, [documents]);

  const saveProgress = useCallback((entry) => {
    // optional handler for ProgressTracker to append to timeline
    const now = new Date().toISOString().split('T')[0];
    setTimeline((t) => [
      ...t,
      {
        id: Math.random().toString(36).substr(2, 9),
        type: 'progress_update',
        title: 'Progress Updated',
        description: `Progress updated for ${selectedChild.name} by ${entry.role}`,
        date: now,
        childId: selectedChild.id,
      },
    ]);
  }, [selectedChild]);

  return (
    <DashboardLayout title="Clinical Intelligence Dashboard">
      <div className="flex flex-col xl:flex-row gap-8 pb-10">
        {/* Left Column: Patient Management */}
        <aside className="w-full xl:w-96 flex flex-col gap-6">
          <div className="glass-modern overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Patient Registry</h2>
                <span className="bg-purple-100 text-purple-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  {assignedChildren.length} Active
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search clinical records..."
                  className="w-full bg-white/40 border border-white/60 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/30 focus:bg-white/60 transition-all"
                />
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
              {assignedChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${selectedChild?.id === child.id
                    ? 'bg-white shadow-[0_10px_25px_-5px_rgba(147,51,234,0.15)] scale-[1.02]'
                    : 'hover:bg-white/40 border border-transparent'
                    }`}
                >
                  {selectedChild?.id === child.id && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-purple-500 to-pink-500"></div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${selectedChild?.id === child.id ? 'bg-purple-50' : 'bg-gray-50'
                      }`}>
                      {child.gender === 'female' ? '👧' : '👦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-bold truncate ${selectedChild?.id === child.id ? 'text-gray-900' : 'text-gray-700'}`}>
                        {child.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        Patient ID: AC-{child.id.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Metrics Overview */}
          <div className="glass-modern p-6 rounded-[2rem] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
               Diagnostic Statistics
            </h3>
            <div className="space-y-6">
              {[
                { label: 'Caseload Capacity', value: '84%', color: 'from-purple-500 to-indigo-500' },
                { label: 'Documentation Compliance', value: '100%', color: 'from-emerald-400 to-cyan-500' },
                { label: 'Intervention Efficacy', value: '92%', color: 'from-pink-500 to-rose-500' }
              ].map((stat, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                    <span>{stat.label}</span>
                    <span>{stat.value}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden p-[1px]">
                    <div className={`h-full rounded-full bg-gradient-to-r ${stat.color}`} style={{ width: stat.value }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          {selectedChild ? (
            <>
          {/* Active Patient Hero Card */}
          <section className="glass-modern p-8 rounded-[2.5rem] border border-white/30 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 hover:opacity-20 transition-opacity">
              <img src="/logo.svg" className="w-32 h-32" alt="" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">
                  Clinical Session Active
                </span>
                <h2 className="text-4xl font-black text-gray-800 tracking-tight leading-none mb-2">
                  {selectedChild?.name}
                </h2>
                <div className="flex items-center gap-4 text-gray-500 font-medium mb-4">
                  <span className="flex items-center gap-1">🧬 {selectedChild.diagnosis}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-1">🗓️ Enrolled {selectedChild.enrolledDate}</span>
                </div>
                
                {mchatScores[selectedChild?.id] && (
                  <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold ${
                    mchatScores[selectedChild?.id].riskLevel === 'Low Risk'
                      ? 'bg-emerald-100 text-emerald-700'
                      : mchatScores[selectedChild?.id].riskLevel === 'Medium Risk'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <span>M-CHAT Initial Screening:</span>
                    <span className="font-black">{mchatScores[selectedChild?.id].riskLevel}</span>
                    <span className="text-[10px]">(Score: {mchatScores[selectedChild?.id].score})</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-2xl border border-white/50">
                {[
                  { id: 'overview', label: 'Analysis', icon: '👁️' },
                  { id: 'documents', label: 'Artifacts', icon: '📁' },
                  { id: 'upload', label: 'Intake', icon: '⬆️' },
                  { id: 'progress', label: 'Efficacy', icon: '📈' },
                  { id: 'timeline', label: 'History', icon: '🕰️' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${tab === t.id
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                      }`}
                  >
                    <span>{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Dynamic Analysis Section */}
          <div className="flex-1">
            {tab === 'overview' && (
              <div className="animate-fadeIn">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-modern p-6 rounded-3xl border border-white/20 bg-white/40">
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Patient Biodata</h3>
                    <div className="grid grid-cols-2 gap-6">
                      {[
                        { label: 'Current Age', value: `${selectedChild.age} yrs` },
                        { label: 'Primary Diagnosis', value: selectedChild.diagnosis },
                        { label: 'Assigned Educator', value: selectedChild.teacherId },
                        { label: 'Guardian Contact', value: selectedChild.parentId }
                      ].map((item, i) => (
                        <div key={i}>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{item.label}</p>
                          <p className="text-gray-800 font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-modern p-6 rounded-3xl border border-white/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-6">Medical Summary</h3>
                    <p className="text-gray-700 text-sm leading-relaxed font-medium italic">
                      "Patient shows significant positive response to visual learning modalities. Recommended focus for coming cycles: sensory integration and peer communication workflows."
                    </p>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">AI</div>
                      <span className="text-xs font-bold text-purple-600 tracking-tight">AI-Generated Diagnostic Insight</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'documents' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-center justify-between glass-modern p-4 rounded-2xl bg-white/60">
                  <h3 className="font-bold text-gray-800">Archive Explorer</h3>
                  <div className="flex gap-3">
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-white/80 border-none rounded-xl text-xs font-bold px-4 py-2 focus:ring-2 focus:ring-purple-400 outline-none shadow-sm capitalize">
                      {uniqueTypes.map((t) => <option key={t} value={t}>{t === 'all' ? 'All Formats' : t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {childDocuments.length > 0 ? (
                    childDocuments.map((doc) => (
                      <div key={doc.id} className="glass-modern bg-white/60 p-5 rounded-3xl border border-white/60 hover:bg-white transition-all group shadow-sm hover:shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                            📄
                          </div>
                          <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full uppercase">Verified</span>
                        </div>
                        <h4 className="font-bold text-gray-800 truncate mb-1">{doc.title}</h4>
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-tighter mb-4">{doc.type}</p>

                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-400 tracking-tight">{doc.uploadedDate}</span>
                          <button className="text-xs font-black text-purple-600 hover:text-purple-700 decoration-2 underline-offset-4 hover:underline transition-all">
                            DOWNLOAD
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center glass-modern rounded-3xl opacity-50 italic font-medium text-gray-500">
                      No clinical artifacts discovered for the current filter criteria...
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'upload' && (
              <div className="animate-fadeIn">
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="glass-modern bg-white/60 border-2 border-dashed border-purple-200 rounded-[3rem] p-16 text-center group hover:border-purple-400 hover:bg-white transition-all cursor-pointer"
                >
                  <div className="w-24 h-24 bg-purple-50 text-purple-500 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    📂
                  </div>
                  <h3 className="text-2xl font-black text-gray-800 mb-4 tracking-tight">Clinical Intake Portal</h3>
                  <p className="text-gray-500 mb-8 font-medium max-w-sm mx-auto leading-relaxed">
                    Securely synchronize medical imagery, diagnostic reports, and behavioral assessments.
                  </p>

                  <label className="inline-block mt-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-sm px-10 py-4 rounded-2xl cursor-pointer hover:shadow-[0_10px_25px_-5px_rgba(124,58,237,0.4)] transform active:scale-95 transition-all">
                    <span>LAUNCH UPLOADER</span>
                    <input type="file" multiple onChange={onFileInput} className="hidden" />
                  </label>

                  <p className="text-[10px] font-black text-gray-300 mt-12 uppercase tracking-[0.3em]">
                    End-to-End Encryption Enabled • Blockchain Hash on Sync
                  </p>
                </div>
              </div>
            )}

            {tab === 'progress' && (
              <div className="animate-fadeIn">
                <ProgressTracker child={selectedChild} role="doctor" onSave={saveProgress} />
              </div>
            )}

            {tab === 'timeline' && (
              <div className="animate-fadeIn space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-8 bg-purple-500 rounded-full"></div>
                  <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Clinical Narrative</h3>
                </div>

                <div className="relative border-l-2 border-purple-100 ml-6 pl-10 space-y-8 py-4">
                  {childTimeline.length > 0 ? (
                    childTimeline.map((ev) => (
                      <div key={ev.id} className="relative group">
                        <div className="absolute -left-[3.25rem] top-0 w-8 h-8 rounded-2xl bg-white border border-purple-100 text-purple-500 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform z-10">
                          {ev.type === 'ai_plan' ? '🤖' : '📄'}
                        </div>
                        <div className="glass-modern bg-white/60 p-6 rounded-3xl border border-white/60 group-hover:bg-white transition-all shadow-sm group-hover:shadow-md">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-gray-800 tracking-tight">{ev.title}</h4>
                            <span className="text-[11px] font-black text-gray-400">{ev.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed font-medium">{ev.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 font-bold italic ml-2">No historical events recorded for this narrative...</p>
                  )}
                </div>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading patient profile...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
}

export default DoctorDashboard;
