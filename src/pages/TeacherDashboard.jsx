import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import { mockChildren, mockDocuments, mockAIRecommendations } from '../data/mockData';
import { getTeacherChildren, getMCHATScore, getUser } from '../services/dataService';
import WeeklyProgressTracker from '../components/WeeklyProgressTracker';
import WeeklyProgressStatus from '../components/WeeklyProgressStatus';
import MCHATResponsesViewer from '../components/MCHATResponsesViewer';
import { generateInsights } from '../utils/progressAi';

function TeacherDashboard() {
  const { currentUser } = useAuth();
  const [assignedChildren, setAssignedChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [uploadedDocs, setUploadedDocs] = useState(mockDocuments);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocType, setNewDocType] = useState('Progress Note');
  const [tab, setTab] = useState('overview');
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mchatScores, setMchatScores] = useState({});
  const [showMCHATResponses, setShowMCHATResponses] = useState(false);
  const [parentInfo, setParentInfo] = useState(null);

  // Fetch children assigned to this teacher
  useEffect(() => {
    if (currentUser?.id) {
      loadTeacherChildren();
    }
  }, [currentUser?.id]);

  const loadTeacherChildren = async () => {
    try {
      setLoading(true);
      const children = await getTeacherChildren(currentUser.id);
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
        setAssignedChildren([]);
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Error loading teacher children:', err);
      setAssignedChildren([]);
      setSelectedChild(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      if (selectedChild) {
        const out = generateInsights(selectedChild.id);
        setAiInsights(out);
      }
    } catch (e) {
      setAiInsights(null);
    }
  }, [selectedChild]);

  // Fetch parent info when selected child changes
  useEffect(() => {
    const loadParentInfo = async () => {
      if (!selectedChild?.parentId) {
        setParentInfo(null);
        return;
      }
      try {
        const parent = await getUser(selectedChild.parentId);
        setParentInfo(parent);
      } catch (err) {
        console.error('Error loading parent info:', err);
        setParentInfo(null);
      }
    };
    loadParentInfo();
  }, [selectedChild?.id]);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!newDocTitle || !selectedChild?.id) return;

    const newDoc = {
      id: Math.random().toString(36).substr(2, 9),
      childId: selectedChild.id,
      type: newDocType,
      title: newDocTitle,
      uploadedBy: 'Ms. Sarah (Classroom Teacher)',
      uploadedDate: new Date().toISOString().split('T')[0],
      url: '#',
    };

    setUploadedDocs([...uploadedDocs, newDoc]);
    setNewDocTitle('');
  };

  const childDocuments = uploadedDocs.filter(doc => doc.childId === selectedChild?.id);

  // Classroom-specific categories for the teacher
  const teacherCategories = useMemo(() => [
    { key: 'communication', label: 'Communication in Class', icon: '💬' },
    { key: 'instructions', label: 'Following Instructions', icon: '📝' },
    { key: 'focus', label: 'Focus Duration', icon: '🎯' },
    { key: 'social', label: 'Social Interaction (Peers)', icon: '🤝' },
    { key: 'emotional', label: 'Emotional Regulation (Class)', icon: '🧘' }
  ], []);

  // Performance breakdown (Mocked for dashboard)
  const performanceStats = useMemo(() => ({
    participation: 78,
    taskCompletion: 92,
    peerEngagement: 65,
    incidents: 0
  }), [selectedChild]);

  return (
    <DashboardLayout title="Educator Intelligence Portal">
      <div className="flex flex-col xl:flex-row gap-8 pb-10">
        {/* Left Column: Student Registry */}
        <aside className="w-full xl:w-96 flex flex-col gap-6">
          <div className="glass-modern overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_8px_32px_0_rgba(135,31,64,0.07)]">
            <div className="p-6 pb-4 bg-gradient-to-br from-rose-50/50 to-pink-50/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 tracking-tight">Classroom Roster</h2>
                <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                  {mockChildren.length} Students
                </span>
              </div>

              <div className="relative mb-4 group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors">
                  🔍
                </span>
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full bg-white/60 border border-white rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400/30 transition-all font-medium"
                />
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto px-4 pb-6 space-y-2 custom-scrollbar">
              {assignedChildren.length > 0 ? (
                assignedChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${selectedChild?.id === child.id
                      ? 'bg-white shadow-[0_10px_25px_-5px_rgba(244,63,94,0.15)] scale-[1.02]'
                      : 'hover:bg-white/40 border border-transparent'
                      }`}
                  >
                    {selectedChild?.id === child.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-rose-500 to-pink-500"></div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${selectedChild?.id === child.id ? 'bg-rose-50' : 'bg-gray-50'
                        }`}>
                        {child.gender === 'female' ? '👧' : '👦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${selectedChild?.id === child.id ? 'text-gray-900' : 'text-gray-700'}`}>
                          {child.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Grade 1-B</span>
                          {child.id === 'child2' && ( // Mock attention alert
                            <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm font-medium italic">
                  No students registered
                </div>
              )}
            </div>
          </div>

          {/* Classroom Alert Panel */}
          <div className="glass-modern p-6 rounded-[2rem] border border-white/20 bg-gradient-to-br from-orange-50/40 to-rose-50/40">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              🚨 Attention Required
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/60 rounded-2xl border border-white/80">
                <p className="text-xs font-bold text-gray-800 mb-1">Observation Alert: {mockChildren[1].name}</p>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Lower focus duration recorded during morning math lesson. Suggested sensory break before next block.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Classroom Workspace */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
                  <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-gray-600 font-medium">Loading classroom workspace...</p>
              </div>
            </div>
          ) : assignedChildren.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="glass-modern p-12 rounded-[2.5rem] border border-white/30 text-center max-w-lg shadow-lg">
                <div className="text-6xl mb-6">🏫</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Students Assigned Yet</h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  Welcome to AutismCare! You currently have no students linked to your classroom. 
                  When parents link their children to your educator profile, their academic tracking and IEP details will appear here.
                </p>
              </div>
            </div>
          ) : selectedChild ? (
            <>
          {/* Active Student Hero */}
          <section className="glass-modern p-8 rounded-[2.5rem] border border-white/30 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute -top-10 -right-10 opacity-5">
              <img src="/logo.svg" className="w-64 h-64" alt="" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-rose-100 text-rose-600 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                      Classroom Active
                    </span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                      IEP Enforced
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-gray-800 tracking-tight leading-none mb-2">
                    {selectedChild?.name}
                  </h2>
                  <p className="text-gray-500 font-medium flex items-center gap-2 mb-4">
                    <span>Year 1 Education Package</span>
                    <span className="w-1.5 h-1.5 bg-rose-300 rounded-full"></span>
                    <span>Classroom Mentor: Ms. Sarah</span>
                  </p>
                  
                  {mchatScores[selectedChild?.id] && (
                    <button
                      onClick={() => setShowMCHATResponses(true)}
                      className={`inline-flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:shadow-md cursor-pointer ${
                        mchatScores[selectedChild?.id].riskLevel === 'Low Risk'
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : mchatScores[selectedChild?.id].riskLevel === 'Medium Risk'
                          ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}>
                      <span>M-CHAT:</span>
                      <span className="font-black">{mchatScores[selectedChild?.id].riskLevel}</span>
                      <span className="text-[10px]">(Score: {mchatScores[selectedChild?.id].score})</span>
                      <span className="ml-1">📋</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 p-1 bg-gray-100/50 rounded-2xl border border-white/50 backdrop-blur-sm">
                  {[
                    { id: 'overview', label: 'Student Bio', icon: '👤' },
                    { id: 'performance', label: 'Tracker', icon: '🧠' },
                    { id: 'reports', label: 'Reports', icon: '📊' },
                    { id: 'ai', label: 'AI Strategy', icon: '✨' },
                    { id: 'docs', label: 'Vault', icon: '📁' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${tab === t.id
                        ? 'bg-white text-rose-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                        }`}
                    >
                      <span>{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Weekly Participation', value: `${performanceStats.participation}%`, trend: '+5%' },
                  { label: 'Task Completion', value: `${performanceStats.taskCompletion}%`, trend: 'Stable' },
                  { label: 'Peer Interaction', value: `${performanceStats.peerEngagement}%`, trend: '-2%' },
                  { label: 'Incidents', value: 'None', trend: 'Excellent' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/40 p-4 rounded-2xl border border-white/60">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">{stat.label}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-xl font-black text-gray-800">{stat.value}</span>
                      <span className={`text-[10px] font-bold ${stat.trend.includes('-') ? 'text-rose-500' : 'text-emerald-500'}`}>{stat.trend}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Dynamic Analysis View */}
          <div className="flex-1 min-h-[400px]">
            {tab === 'overview' && (
              <div className="animate-fadeIn grid md:grid-cols-2 gap-6">
                <div className="glass-modern p-8 rounded-3xl border border-white/20">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6">Educational Profile</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-2 leading-none">Diagnostic Context</p>
                      <p className="text-lg font-bold text-gray-800 leading-tight">{selectedChild.diagnosis}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Age</p>
                        <p className="font-bold text-gray-800">{selectedChild.age} Years</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Enrolled Since</p>
                        <p className="font-bold text-gray-800">{selectedChild.enrolledDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-modern p-8 rounded-3xl border border-white/20 bg-gradient-to-br from-rose-50/50 to-purple-50/50">
                  <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-6">Recent Classroom Mood</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-sm flex items-center justify-center text-4xl">😊</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-600 leading-relaxed uppercase tracking-tighter">Overall positive engagement in group activities this week.</p>
                    </div>
                  </div>
                </div>

                {/* Guardian Information Card */}
                <div className="md:col-span-2 glass-modern p-8 rounded-3xl border border-white/20 bg-gradient-to-br from-blue-50/30 to-cyan-50/30">
                  <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span>👨‍👩‍👧</span> Guardian Information
                  </h3>
                  {parentInfo ? (
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Guardian Name</p>
                        <p className="font-bold text-gray-800">{parentInfo.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Email</p>
                        <p className="font-bold text-gray-800 truncate">{parentInfo.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phone</p>
                        <div className="flex items-center gap-2">
                          <span className="text-base">📞</span>
                          <p className="font-bold text-gray-800">
                            {parentInfo.phone || <span className="text-gray-400 italic font-medium">Not provided</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic font-medium">No guardian linked to this child.</p>
                  )}
                </div>
              </div>
            )}

            {tab === 'performance' && (
              <div className="animate-fadeIn space-y-8">
                <WeeklyProgressStatus childId={selectedChild?.id} role="teacher" />
                <div className="bg-rose-50/30 p-4 rounded-2xl mb-6 border border-rose-100/50 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <span>💡</span>
                  <span>Note: Ratings below represent School-Based Observations and classroom learning behaviors.</span>
                </div>
                <WeeklyProgressTracker
                  child={selectedChild}
                  role="teacher"
                  userId={currentUser?.id}
                  customMetrics={teacherCategories}
                  onSubmit={() => {
                    console.log('✅ Teacher weekly progress submitted');
                  }}
                />
              </div>
            )}

            {tab === 'reports' && (
              <div className="animate-fadeIn space-y-6">
                <div className="glass-modern p-8 rounded-[2.5rem] border border-white/20 bg-white/40">
                  <h3 className="text-2xl font-black text-gray-800 mb-8 tracking-tight">Weekly Narrative Report</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {[
                        { label: 'Classroom Participation', desc: 'Active involvement in group discussions' },
                        { label: 'Task Completion Rate', desc: 'Percentage of assigned work finalized' },
                        { label: 'Peer Engagement Level', desc: 'Success rate of social interactions' }
                      ].map((field, i) => (
                        <div key={i}>
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">{field.label}</label>
                          <div className="h-12 w-full bg-white rounded-xl border border-gray-100 shadow-inner flex items-center px-4">
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                            <span className="ml-4 font-black text-sm text-gray-800">85%</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 italic font-medium">{field.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white/60 p-6 rounded-3xl border border-white shadow-sm flex flex-col">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 block">Behavioral Incidents Log</label>
                      <div className="flex-1 flex items-center justify-center flex-col text-center opacity-40">
                        <span className="text-4xl mb-4">🌈</span>
                        <p className="text-sm font-bold text-gray-800 uppercase tracking-tighter">Zero incidents recorded this period</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'ai' && (
              <div className="animate-fadeIn space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="glass-modern p-6 rounded-3xl border border-white/40 bg-gradient-to-br from-indigo-50/50 to-rose-50/50">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Current Focus Domain</p>
                    <p className="text-xl font-black text-gray-800">Sensory Integration</p>
                  </div>
                  <div className="glass-modern p-6 rounded-3xl border border-white/40 bg-gradient-to-br from-rose-50/50 to-pink-50/50">
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Home vs School Efficacy</p>
                    <p className="text-xl font-black text-gray-800">92% Correlation</p>
                  </div>
                  <div className="glass-modern p-6 rounded-3xl border border-white/40 bg-gradient-to-br from-purple-50/50 to-indigo-50/50">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">AI Strategy Confidence</p>
                    <p className="text-xl font-black text-gray-800">Premium High</p>
                  </div>
                </div>

                <div className="glass-modern p-10 rounded-[3rem] border border-white/30 bg-white/40">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-rose-500/20">AI</div>
                    <h3 className="text-2xl font-black text-gray-800 tracking-tight">Suggested Classroom Strategies</h3>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      {[
                        { title: 'Visual Schedule Priming', detail: 'Preview upcoming transitions using icons 5 minutes prior.' },
                        { title: 'Choice Reinforcement', detail: 'Offer choice between two valid classroom tasks to promote agency.' }
                      ].map((strat, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-rose-500 font-black">0{i + 1}.</span>
                          <div>
                            <p className="font-bold text-gray-800 uppercase tracking-tighter text-sm mb-1">{strat.title}</p>
                            <p className="text-sm text-gray-600 font-medium leading-relaxed">{strat.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-rose-50/40 p-6 rounded-3xl border border-rose-100 flex flex-col justify-center">
                      <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest mb-4 italic">Comparison Insight</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                        "Engagement levels during collaborative play are 24% higher in class than reported home social settings. Strategy: Leverage classroom peer models for social scripts."
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'docs' && (
              <div className="animate-fadeIn space-y-8">
                {/* Upload Section */}
                <div className="glass-modern p-8 rounded-[2.5rem] border border-white/30 bg-white/40">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Archive Submission</h3>
                  <form onSubmit={handleUpload} className="flex flex-col md:flex-row gap-4">
                    <select
                      value={newDocType}
                      onChange={(e) => setNewDocType(e.target.value)}
                      className="bg-white px-6 py-3 rounded-2xl border-none font-bold text-sm text-gray-600 focus:ring-2 focus:ring-rose-400 shadow-sm"
                    >
                      <option value="Progress Note">Progress Note</option>
                      <option value="Activity Report">Activity Report</option>
                      <option value="Behavior Log">Behavior Log</option>
                    </select>
                    <input
                      type="text"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      placeholder="Enter artifact title..."
                      className="flex-1 bg-white px-6 py-3 rounded-2xl border-none font-bold text-sm focus:ring-2 focus:ring-rose-400 shadow-sm"
                    />
                    <button type="submit" className="bg-rose-500 text-white font-black text-xs px-8 py-3 rounded-2xl hover:bg-rose-600 transition-all uppercase tracking-widest shadow-lg shadow-rose-500/20">
                      Sync Artifact
                    </button>
                  </form>
                </div>

                {/* Docs Grid */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childDocuments.slice().reverse().map((doc) => (
                    <div key={doc.id} className="glass-modern bg-white/60 p-6 rounded-3xl border border-white/60 hover:bg-white transition-all group shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xl">📄</div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{doc.uploadedDate}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 truncate mb-1 leading-tight">{doc.title}</h4>
                      <p className="text-xs font-black text-rose-400 uppercase tracking-tighter">{doc.type}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
            </>
          ) : null}
        </main>
      </div>

      {/* M-CHAT Responses Viewer */}
      <MCHATResponsesViewer
        isOpen={showMCHATResponses}
        onClose={() => setShowMCHATResponses(false)}
        child={selectedChild}
        mchatData={mchatScores[selectedChild?.id]}
      />
    </DashboardLayout>
  );
}

export default TeacherDashboard;
