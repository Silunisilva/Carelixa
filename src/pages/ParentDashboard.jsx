import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import AddChildModal from '../components/AddChildModal';
import ManageChildAssignments from '../components/ManageChildAssignments';
import MCHATModal from '../components/MCHATModal';
import { mockChildren, mockTimeline, mockAIPlans, mockDocuments, mockTeachers, mockDoctors } from '../data/mockData';
import { getParentChildren, getUser, getMCHATScore, updateUser } from '../services/dataService';
import ProgressTracker from '../components/ProgressTracker';
import WeeklyParentBehaviorForm from '../components/WeeklyParentBehaviorForm';
import WeeklyProgressStatus from '../components/WeeklyProgressStatus';

function ParentDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [myChildren, setMyChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [tab, setTab] = useState('analysis'); // analysis, sync, insights, vault
  const [loading, setLoading] = useState(true);
  const [showAddChild, setShowAddChild] = useState(false);
  const [showManageAssignments, setShowManageAssignments] = useState(false);
  const [showMCHAT, setShowMCHAT] = useState(false);
  const [nextDoctorVisits, setNextDoctorVisits] = useState({});
  const [editingDateFor, setEditingDateFor] = useState(null);
  const [careTeamDoctors, setCareTeamDoctors] = useState([]);
  const [careTeamTeachers, setCareTeamTeachers] = useState([]);
  const [mchatScores, setMchatScores] = useState({});
  const [parentPhone, setParentPhone] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({ name: '', age: '', gender: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Fetch children from Firestore
  useEffect(() => {
    if (currentUser?.id) {
      loadChildren();
      // Load parent phone number
      getUser(currentUser.id).then(userData => {
        if (userData?.phone) setParentPhone(userData.phone);
      });
    }
  }, [currentUser?.id]);

  const handleSavePhone = async () => {
    if (!currentUser?.id) return;
    setSavingPhone(true);
    try {
      await updateUser(currentUser.id, { phone: parentPhone });
      setEditingPhone(false);
    } catch (err) {
      console.error('Error saving phone:', err);
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedChild) return;
    setSavingProfile(true);
    try {
      // Import updateChild if not already imported at top
      const updates = {
        name: profileFormData.name,
        age: parseInt(profileFormData.age, 10),
        gender: profileFormData.gender
      };
      import('../services/dataService').then(({ updateChild }) => {
        updateChild(selectedChild.id, updates).then(() => {
          const updatedChild = { ...selectedChild, ...updates };
          setSelectedChild(updatedChild);
          setMyChildren(prev => prev.map(c => c.id === selectedChild.id ? updatedChild : c));
          setEditingProfile(false);
          setSavingProfile(false);
        }).catch(err => {
          console.error('Error saving profile:', err);
          setSavingProfile(false);
        });
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      setSavingProfile(false);
    }
  };

  const loadChildren = async () => {
    try {
      setLoading(true);
      let children = await getParentChildren(currentUser.id);
      
      // Fallback to mock data if no children found, or populate with mock data for demo
      if (children.length === 0) {
        children = mockChildren.filter(c => c.parentId === currentUser.id);
      }
      
      // Ensure each child has linkedDoctors and linkedTeachers arrays
      children = children.map(child => {
        const linkedDoctors = child.linkedDoctors && Array.isArray(child.linkedDoctors) 
          ? child.linkedDoctors 
          : (child.doctorId ? [child.doctorId] : []);
        
        const linkedTeachers = child.linkedTeachers && Array.isArray(child.linkedTeachers)
          ? child.linkedTeachers
          : (child.teacherId ? [child.teacherId] : []);
        
        return {
          ...child,
          linkedDoctors,
          linkedTeachers,
        };
      });
      
      setMyChildren(children);
      // Initialize doctor visit dates
      const visitDates = {};
      children.forEach(child => {
        visitDates[child.id] = '2026-09-22';
      });
      setNextDoctorVisits(visitDates);
      if (children.length > 0) {
        setSelectedChild(children[0]);
      } else {
        setSelectedChild(null); // Empty state for new parents
      }
      
      // Load M-CHAT scores for all children
      loadMCHATScores(children);
    } catch (err) {
      console.error('Error loading children:', err);
      setMyChildren([]);
      setSelectedChild(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMCHATScores = async (children) => {
    try {
      const scores = {};
      for (const child of children) {
        const mchatData = await getMCHATScore(child.id);
        if (mchatData) {
          scores[child.id] = mchatData;
        }
      }
      setMchatScores(scores);
    } catch (err) {
      console.error('Error loading M-CHAT scores:', err);
    }
  };

  const handleChildAdded = (newChild) => {
    setMyChildren([...myChildren, newChild]);
    setSelectedChild(newChild);
    setNextDoctorVisits(prev => ({
      ...prev,
      [newChild.id]: '2026-09-22'
    }));
  };

  const handleMCHATScoreSaved = (scoreData) => {
    if (selectedChild) {
      setMchatScores(prev => ({
        ...prev,
        [selectedChild.id]: scoreData,
      }));
      // Update selected child to reflect new score
      setSelectedChild(prev => ({
        ...prev,
        mchatScore: scoreData.score,
        mchatRiskLevel: scoreData.riskLevel,
        mchatCompleted: true,
      }));
    }
  };

  // Refresh selected child data after care team assignments
  const handleManageAssignmentsClose = async () => {
    setShowManageAssignments(false);
    // Refresh the selected child to get updated linkedTeachers and linkedDoctors
    if (selectedChild) {
      try {
        const updatedChildren = await getParentChildren(currentUser.id);
        const updatedChild = updatedChildren.find(c => c.id === selectedChild.id);
        if (updatedChild) {
          // Ensure linked arrays are set
          updatedChild.linkedDoctors = updatedChild.linkedDoctors || (updatedChild.doctorId ? [updatedChild.doctorId] : []);
          updatedChild.linkedTeachers = updatedChild.linkedTeachers || (updatedChild.teacherId ? [updatedChild.teacherId] : []);
          setSelectedChild(updatedChild);
          // Also update in myChildren list
          setMyChildren(prevChildren =>
            prevChildren.map(c => c.id === updatedChild.id ? updatedChild : c)
          );
        }
      } catch (err) {
        console.error('Error refreshing child data:', err);
      }
    }
  };

  // Fetch care team members for selected child
  useEffect(() => {
    const loadCareTeam = async () => {
      if (!selectedChild) {
        setCareTeamDoctors([]);
        setCareTeamTeachers([]);
        return;
      }

      try {
        // Fetch doctors
        const doctorIds = selectedChild.linkedDoctors && Array.isArray(selectedChild.linkedDoctors)
          ? selectedChild.linkedDoctors
          : (selectedChild.doctorId ? [selectedChild.doctorId] : []);
        
        const doctors = await Promise.all(
          doctorIds.map(id => getUser(id))
        );
        setCareTeamDoctors(doctors.filter(d => d !== null));

        // Fetch teachers
        const teacherIds = selectedChild.linkedTeachers && Array.isArray(selectedChild.linkedTeachers)
          ? selectedChild.linkedTeachers
          : (selectedChild.teacherId ? [selectedChild.teacherId] : []);
        
        const teachers = await Promise.all(
          teacherIds.map(id => getUser(id))
        );
        setCareTeamTeachers(teachers.filter(t => t !== null));

        // Reload M-CHAT score for this child
        const mchatData = await getMCHATScore(selectedChild.id);
        if (mchatData) {
          setMchatScores(prev => ({
            ...prev,
            [selectedChild.id]: mchatData,
          }));
        }
      } catch (err) {
        console.error('Error loading care team:', err);
        setCareTeamDoctors([]);
        setCareTeamTeachers([]);
      }
    };

    loadCareTeam();
  }, [selectedChild?.id]);

  // Get care team members for selected child (using state instead of mocking)
  const doctors = careTeamDoctors;
  const teachers = careTeamTeachers;
  const nextVisitDate = selectedChild ? nextDoctorVisits[selectedChild.id] || '2026-09-22' : null;

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Handle date change
  const handleDateChange = (e) => {
    if (selectedChild) {
      setNextDoctorVisits(prev => ({
        ...prev,
        [selectedChild.id]: e.target.value
      }));
      setEditingDateFor(null);
    }
  };

  const childTimeline = mockTimeline.filter(event => event.childId === selectedChild?.id);
  const childPlan = mockAIPlans.find(plan => plan.childId === selectedChild?.id);

  // Mock report data
  const childReports = mockDocuments.filter(d => d.childId === selectedChild?.id);

  return (
    <DashboardLayout title="Parental Care Hub">
      <div className="flex flex-col xl:flex-row gap-8 pb-10">
        {/* Left Column: Family Profiles & Reminders */}
        <aside className="w-full xl:w-96 flex flex-col gap-6">
          <div className="glass-modern overflow-hidden rounded-[2rem] border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
            <div className="p-6 pb-4 bg-gradient-to-br from-blue-50/50 to-cyan-50/50">
              <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-4">Family Circle</h2>
              <div className="space-y-2">
                {myChildren.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`w-full text-left p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                      selectedChild?.id === child.id
                        ? 'bg-white shadow-[0_10px_25px_-5px_rgba(14,165,233,0.15)] scale-[1.02]'
                        : 'hover:bg-white/40 border border-transparent'
                      }`}
                  >
                    {selectedChild?.id === child.id && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${
                        selectedChild?.id === child.id ? 'bg-blue-50' : 'bg-gray-50'
                        }`}>
                        {child.gender === 'female' ? '👧' : '👦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`font-bold truncate ${
                          selectedChild?.id === child.id ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {child.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">
                          {child.diagnosis}
                        </div>
                        {mchatScores[child.id] && (
                          <div className={`text-[9px] font-black mt-1 px-2 py-0.5 rounded inline-block ${
                            mchatScores[child.id].riskLevel === 'Low Risk'
                              ? 'bg-emerald-100 text-emerald-700'
                              : mchatScores[child.id].riskLevel === 'Medium Risk'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            M-CHAT: {mchatScores[child.id].riskLevel}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/30 space-y-2">
                <button
                  onClick={() => setShowAddChild(true)}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg transition-all flex items-center justify-center gap-2 font-medium"
                >
                  <span className="text-lg">➕</span> Add New Child
                </button>
                {selectedChild && (
                  <button
                    onClick={() => setShowManageAssignments(true)}
                    className="w-full py-3 px-4 rounded-xl border border-purple-300 text-purple-700 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
                  >
                    <span className="text-lg">🔗</span> Manage Care Team
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Care Team & Upcoming */}
          <div className="glass-modern p-6 rounded-[2rem] border border-white/20">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
              🏥 Next Medical Milestone
            </h3>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-xl shadow-sm">📅</div>
                <div className="flex-1">
                  <p className="text-xs font-black text-blue-600 uppercase">Doctor Visit</p>
                  {editingDateFor === selectedChild?.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="date"
                        value={nextVisitDate}
                        onChange={handleDateChange}
                        className="px-3 py-1 rounded-lg border border-blue-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => setEditingDateFor(null)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-800">{formatDateDisplay(nextVisitDate)}</p>
                      <button
                        onClick={() => setEditingDateFor(selectedChild?.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">Routine developmental screening.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Assigned Care Team</h4>
              
              <div className="space-y-3">
                {doctors.length > 0 && (
                  <>
                    <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Doctors</div>
                    {doctors.map((doctor) => (
                      <div key={doctor.id} className="flex items-center gap-3 p-3 bg-white/40 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center text-xs">👨‍⚕️</div>
                        <div className="text-xs flex-1 min-w-0">
                          <p className="font-bold text-gray-800">{doctor.name}</p>
                          {doctor.specialization && <p className="text-gray-500 text-[10px]">{doctor.specialization}</p>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
                
                {teachers.length > 0 && (
                  <>
                    <div className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-4">Teachers</div>
                    {teachers.map((teacher) => (
                      <div key={teacher.id} className="flex items-center gap-3 p-3 bg-white/40 rounded-lg">
                        <div className="w-8 h-8 rounded-full bg-pink-100 flex-shrink-0 flex items-center justify-center text-xs">👩‍🏫</div>
                        <div className="text-xs flex-1 min-w-0">
                          <p className="font-bold text-gray-800">{teacher.name}</p>
                          {teacher.specialization && <p className="text-gray-500 text-[10px]">{teacher.specialization}</p>}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Screening Tools */}
          <div className="glass-modern p-6 rounded-[2rem] border border-white/20 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
              🧠 Screening Tools
            </h3>
            <button
              onClick={() => setShowMCHAT(true)}
              className="w-full p-4 bg-white hover:bg-indigo-50 border-2 border-indigo-200 text-indigo-700 font-bold rounded-2xl transition-all flex items-center gap-3 group"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
              <div className="text-left">
                <p className="font-black text-sm">M-CHAT Screening</p>
                <p className="text-[10px] text-gray-500 font-medium">20-question assessment</p>
              </div>
              <span className="ml-auto text-lg group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          {/* My Contact Info */}
          <div className="glass-modern p-6 rounded-[2rem] border border-white/20 bg-gradient-to-br from-cyan-50/50 to-blue-50/50">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
              📞 My Contact Info
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Email</p>
                <p className="text-sm font-bold text-gray-700 truncate">{currentUser?.email || 'Not set'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Phone Number</p>
                {editingPhone ? (
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      className="flex-1 px-3 py-2 rounded-lg border border-blue-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSavePhone}
                      disabled={savingPhone}
                      className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-bold hover:bg-blue-600 disabled:opacity-50"
                    >
                      {savingPhone ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingPhone(false)}
                      className="px-2 py-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-700">
                      {parentPhone || <span className="text-gray-400 italic">Not set</span>}
                    </p>
                    <button
                      onClick={() => setEditingPhone(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                    >
                      {parentPhone ? 'Edit' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 font-medium italic">
                This info is shared with your child's assigned teacher and doctor.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="flex-1 flex flex-col gap-8 min-w-0">
          {selectedChild ? (
            <>
          {/* Parent Hero Section */}
          <section className="glass-modern p-8 rounded-[2.5rem] border border-white/30 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <img src="/logo.svg" className="w-32 h-32" alt="" />
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                    Primary Care Active
                  </span>
                  <h2 className="text-4xl font-black text-gray-800 tracking-tight leading-none mb-2">
                    {selectedChild?.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-gray-500 font-medium text-sm">
                    <span className="flex items-center gap-1">✨ Focus: <span className="text-blue-600 font-bold">Social Interaction</span></span>
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1">🕰️ Last Update: <span className="text-gray-800">2 days ago</span></span>
                  </div>
                </div>

                <div>
                  {mchatScores[selectedChild?.id] ? (
                    <div className={`p-4 rounded-2xl text-center ${
                      mchatScores[selectedChild?.id].riskLevel === 'Low Risk'
                        ? 'bg-emerald-50 border-2 border-emerald-300'
                        : mchatScores[selectedChild?.id].riskLevel === 'Medium Risk'
                        ? 'bg-amber-50 border-2 border-amber-300'
                        : 'bg-red-50 border-2 border-red-300'
                    }`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">M-CHAT Risk Level</p>
                      <p className={`text-xl font-black ${
                        mchatScores[selectedChild?.id].riskLevel === 'Low Risk'
                          ? 'text-emerald-700'
                          : mchatScores[selectedChild?.id].riskLevel === 'Medium Risk'
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}>
                        {mchatScores[selectedChild?.id].riskLevel}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">Score: {mchatScores[selectedChild?.id].score}</p>
                      <button
                        onClick={() => setShowMCHAT(true)}
                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 mt-2 underline"
                      >
                        Retake Test →
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowMCHAT(true)}
                      className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-300 hover:bg-blue-100 transition-all text-center w-full"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">M-CHAT</p>
                      <p className="text-lg font-black text-blue-700">Not Completed</p>
                      <p className="text-xs text-blue-600 mt-1">Click to begin screening →</p>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 p-1 bg-gray-100/30 rounded-2xl border border-white/50 backdrop-blur-md">
                {[
                  { id: 'analysis', label: 'Analysis', icon: '👁️' },
                  { id: 'profile', label: 'Profile', icon: '👤' },
                  { id: 'sync', label: 'Home Sync', icon: '🔄' },
                  { id: 'insights', label: 'AI Strategy', icon: '🤖' },
                  { id: 'vault', label: 'Reports', icon: '📊' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${tab === t.id
                      ? 'bg-white text-blue-600 shadow-sm'
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

          <div className="flex-1">
            {tab === 'profile' && (
              <div className="animate-fadeIn space-y-6">
                <div className="glass-modern p-8 rounded-[2.5rem] border border-white/20 bg-white/40">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Child Profile Details</h3>
                    {!editingProfile ? (
                      <button 
                        onClick={() => {
                          setProfileFormData({ name: selectedChild.name, age: selectedChild.age, gender: selectedChild.gender });
                          setEditingProfile(true);
                        }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-200 transition-colors"
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingProfile(false)}
                          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveProfile}
                          disabled={savingProfile}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {savingProfile ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Child's Name</label>
                      {editingProfile ? (
                        <input 
                          type="text" 
                          value={profileFormData.name} 
                          onChange={e => setProfileFormData(prev => ({...prev, name: e.target.value}))}
                          className="w-full px-4 py-2 rounded-lg bg-white/60 border border-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 font-medium shadow-inner"
                        />
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{selectedChild.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Age</label>
                      {editingProfile ? (
                        <input 
                          type="number" 
                          value={profileFormData.age} 
                          onChange={e => setProfileFormData(prev => ({...prev, age: e.target.value}))}
                          className="w-full px-4 py-2 rounded-lg bg-white/60 border border-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 font-medium shadow-inner"
                        />
                      ) : (
                        <p className="text-gray-800 font-bold text-lg">{selectedChild.age} yrs</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Gender</label>
                      {editingProfile ? (
                        <select 
                          value={profileFormData.gender} 
                          onChange={e => setProfileFormData(prev => ({...prev, gender: e.target.value}))}
                          className="w-full px-4 py-2 rounded-lg bg-white/60 border border-white focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 font-medium shadow-inner"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      ) : (
                        <p className="text-gray-800 font-bold text-lg capitalize">{selectedChild.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Diagnosis (ASD Level)</label>
                      <div className="w-full px-4 py-2 rounded-lg bg-gray-100/50 border border-gray-200 text-gray-500 font-medium flex justify-between items-center cursor-not-allowed">
                        <span>{selectedChild.diagnosis}</span>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase tracking-wide">Doctor Managed</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1.5 italic leading-snug">Only an assigned doctor can modify the clinical diagnosis (ASD Level). To change this, consult with your care team.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'analysis' && (
              <div className="animate-fadeIn space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-modern p-10 rounded-[2.5rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-black shadow-xl shadow-blue-500/20">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-70 mb-6">Current Focus Area</h3>
                    <p className="text-4xl font-black mb-4">Communication & Social Scripts</p>
                    <p className=" leading-relaxed font-medium text-black italic">
                      "Emma is responding exceptionally well to visual cue cards. We are currently bridging from single words to 2-word requests."
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-modern p-6 rounded-3xl border border-white/20 bg-white/40">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Engagement</p>
                      <p className="text-3xl font-black text-gray-800 text-center">84%</p>
                      <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[84%]"></div>
                      </div>
                    </div>
                    <div className="glass-modern p-6 rounded-3xl border border-white/20 bg-white/40">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Independence</p>
                      <p className="text-3xl font-black text-gray-800 text-center">62%</p>
                      <div className="mt-3 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[62%]"></div>
                      </div>
                    </div>
                    <div className="col-span-2 glass-modern p-6 rounded-3xl border border-white/20 bg-emerald-50/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Weekly Status</p>
                          <p className="font-bold text-gray-800">Excellent - No Major Regression</p>
                        </div>
                        <span className="text-2xl">✨</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-modern p-8 rounded-[2.5rem] border border-white/20">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">Activity Narrative</h3>
                  <div className="space-y-4">
                    {childTimeline.slice(0, 3).map((ev) => (
                      <div key={ev.id} className="flex items-start gap-4 p-4 bg-white/40 rounded-2xl hover:bg-white transition-all shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-xl shadow-inner">
                          {ev.type === 'ai_plan' ? '🤖' : '📄'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-gray-800">{ev.title}</p>
                            <span className="text-[10px] font-black text-black uppercase">{ev.date}</span>
                          </div>
                          <p className="text-sm text-gray-500 font-medium mt-1">{ev.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'sync' && selectedChild && (
              <div className="animate-fadeIn space-y-8">
                <WeeklyProgressStatus childId={selectedChild.id} role="parent" />
                <WeeklyParentBehaviorForm 
                  child={selectedChild} 
                  parentId={currentUser?.id}
                  onSubmit={() => {
                    console.log('Weekly progress submitted successfully');
                  }}
                />
              </div>
            )}

            {tab === 'insights' && (
              <div className="animate-fadeIn space-y-8">
                <div className="glass-modern p-10 rounded-[3rem] border border-white/30 bg-white/40 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                    <div className="text-9xl">💡</div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="w-14 h-14 bg-blue-600 text-white rounded-3xl flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-500/20">AI</div>
                      <div>
                        <h3 className="text-3xl font-black text-gray-800 tracking-tight leading-none">Intelligence Advisory</h3>
                        <p className="text-sm font-bold text-blue-500 uppercase tracking-widest mt-1">Status: High Precision Strategy</p>
                      </div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12">
                      <div>
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4">Focus Domain Analysis</h4>
                        <div className="p-6 bg-white/60 rounded-[2rem] border border-white mb-8">
                          <p className="text-2xl font-black text-gray-800 mb-2">Communication Efficacy</p>
                          <p className="text-sm text-gray-600 font-medium leading-relaxed italic border-l-4 border-blue-400 pl-4">
                            "Reason: Based on therapist reports and your tracking data, Emma shows increased attempts at vocalizing choice but requires prompt reinforcement."
                          </p>
                        </div>

                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] mb-4 text-center border-b pb-4">Home Enrichment Protocol</h4>
                        <div className="space-y-4">
                          {[
                            { title: 'Choice Reinforcement', desc: 'Present two preferred fruits during snack; wait 5 seconds for vocalization before providing choice.' },
                            { title: 'Visual Prompt Fading', desc: 'Slowly distance the physical icons while verbalizing the activity name.' }
                          ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex-shrink-0 flex items-center justify-center font-black">0{i + 1}</div>
                              <div>
                                <p className="font-bold text-gray-800 uppercase tracking-tighter text-sm mb-1">{item.title}</p>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-900/5 rounded-[2.5rem] p-8 border border-blue-100 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                          <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Weekly Parental Checklog</h4>
                          <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full">3 of 5 Done</span>
                        </div>
                        <div className="space-y-4 flex-1">
                          {[
                            { label: 'Morning transition routine', active: true },
                            { label: 'Eye contact reinforcement during dinner', active: true },
                            { label: 'Shared reading session (15 mins)', active: true },
                            { label: 'Social greeting practice with neighbors', active: false },
                            { label: 'Independent play (10 min quiet block)', active: false }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl group cursor-pointer hover:bg-white transition-all">
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.active ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200'}`}>
                                {item.active && <span className="text-[10px]">✓</span>}
                              </div>
                              <span className={`text-sm font-bold ${item.active ? 'text-gray-800' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                {item.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-widest mt-8">Strategies Refresh every Monday at 8:00 AM</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === 'vault' && (
              <div className="animate-fadeIn space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-2xl font-black text-gray-800 tracking-tight">Clinical Vault</h3>
                  <div className="flex gap-2">
                    <button className="px-5 py-2 glass rounded-xl text-xs font-black uppercase text-gray-500 hover:text-blue-600 transition-all">Download All</button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {childReports.map((doc) => (
                    <div key={doc.id} className="glass-modern bg-white/60 p-6 rounded-[2rem] border border-white hover:bg-white transition-all group shadow-sm hover:shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 py-1.5 px-4 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-bl-2xl flex items-center gap-1 border-l border-b border-emerald-100/50">
                        Verified <span className="text-[11px]">✓</span>
                      </div>

                      <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        📄
                      </div>

                      <h4 className="text-lg font-black text-gray-800 leading-tight mb-1 truncate pr-16">{doc.title}</h4>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">{doc.type}</p>

                      <div className="pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
                        <span className="text-[11px] font-black text-gray-300 tracking-tighter">{doc.uploadedDate}</span>
                        <button className="text-[10px] font-black text-blue-600 hover:text-blue-800 underline underline-offset-4 decoration-2">ACCESS PDF</button>
                      </div>
                    </div>
                  ))}

                  {/* Mock Monthly Report Placeholder */}
                  <div className="glass-modern bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-[2rem] border-2 border-dashed border-blue-200 flex flex-col items-center justify-center text-center opacity-70 group hover:opacity-100 cursor-pointer transition-opacity">
                    <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">📈</div>
                    <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">August Executive Report</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Generating Final Assessment...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 ro unded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">👨‍👩‍👧</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">No Children Added Yet</h3>
                <p className="text-gray-600 mb-6">Start by adding your child to begin tracking their progress</p>
                <button
                  onClick={() => setShowAddChild(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                >
                  + Add Your First Child
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AddChildModal
        isOpen={showAddChild}
        onClose={() => setShowAddChild(false)}
        onChildAdded={handleChildAdded}
        parentId={currentUser?.id}
      />
      
      {selectedChild && (
        <ManageChildAssignments
          isOpen={showManageAssignments}
          onClose={handleManageAssignmentsClose}
          child={selectedChild}
        />
      )}

      {selectedChild && (
        <MCHATModal
          isOpen={showMCHAT}
          onClose={() => setShowMCHAT(false)}
          child={selectedChild}
          onScoreSaved={handleMCHATScoreSaved}
        />
      )}
    </DashboardLayout>
  );
}

export default ParentDashboard;
