import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DashboardLayout({ children, title }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'doctor':
        return '👨‍⚕️';
      case 'teacher':
        return '👩‍🏫';
      case 'parent':
        return '👨‍👩‍👧';
      default:
        return '👤';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'doctor':
        return 'from-purple-500 to-indigo-500';
      case 'teacher':
        return 'from-pink-500 to-rose-500';
      case 'parent':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Navigation */}
      <nav className="glass fixed top-0 left-0 right-0 z-50 mx-4 my-4">
        <div className="max-w-8xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-12">
            <div className="relative flex items-center cursor-pointer group" onClick={() => navigate('/')}>
              <div className="absolute -top-8 left-0 transition-all duration-500 group-hover:scale-110">
                <img src="/logo.svg" alt="AutismCare Logo" className="h-32 w-auto filter drop-shadow-xl" />
              </div>
              {/* Horizontal spacer for layout balance */}
              <div className="w-32 h-16"></div>
            </div>
            <span className="text-gray-300">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getRoleIcon(currentUser?.role)}</span>
              <span className="font-medium text-gray-700 capitalize">
                {currentUser?.role} Dashboard
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-700">{currentUser?.name}</div>
              <div className="text-xs text-gray-500">{currentUser?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 glass hover:bg-white/40 rounded-lg transition-all text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-28 px-6 pb-12">
        <div className="max-w-8xl mx-auto">
          <div className="mb-8">
            <h1 className={`text-4xl font-bold mb-2 bg-gradient-to-r ${getRoleColor(currentUser?.role)} bg-clip-text text-transparent`}>
              {title}
            </h1>
            <p className="text-gray-600">Welcome back, {currentUser?.name}!</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;
