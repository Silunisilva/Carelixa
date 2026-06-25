import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

function AuthPage({ mode = 'login' }) {
  const navigate = useNavigate();
  const { login, register, loginWithGoogle, currentUser, authLoading } = useAuth();

  // Shared states
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Login password visibility state
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register states
  const [name, setName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('parent');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Register password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redirect if already logged in (and not in success state)
  useEffect(() => {
    if (!authLoading && currentUser && !registerSuccess && !loginSuccess) {
      navigate(`/${currentUser.role}`, { replace: true });
    }
  }, [currentUser, authLoading, navigate, registerSuccess, loginSuccess]);

  // Countdown timer for registration success redirect
  useEffect(() => {
    if (!registerSuccess) return;
    if (countdown <= 0) {
      navigate(`/${role}`, { replace: true });
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [registerSuccess, countdown, navigate, role]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      setLoading(false);
      setLoginSuccess(true);
      navigate(`/${user.role || 'parent'}`, { replace: true });
    } catch (err) {
      console.error('Login error', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check if passwords match
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Check password length
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(regEmail, regPassword, role, name);
      setLoading(false);
      setRegisterSuccess(true);
    } catch (err) {
      console.error('Register error', err);
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (selectedRole) => {
    setError('');
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle(selectedRole);
      setGoogleLoading(false);
      if (mode === 'login') {
        setLoginSuccess(true);
      } else {
        setRegisterSuccess(true);
      }
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      console.error('Google sign-in error', err);
      setError(err.message || 'Failed to sign in with Google.');
      setGoogleLoading(false);
    }
  };

  // Add this at the top of your component (after the imports)
  const roleConfig = {
    parent: {
      label: 'Parent',
      icon: '/parent.svg',
      alt: 'Parent icon'
    },
    teacher: {
      label: 'Teacher',
      icon: '/teacher.svg',
      alt: 'Teacher icon'
    },
    doctor: {
      label: 'Doctor',
      icon: '/doctor.svg',
      alt: 'Doctor icon'
    }
  };

  // If registration is successful, render the elegant full-screen success card
  if (registerSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="absolute top-20 left-10 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="glass p-10 max-w-md w-full relative z-10 text-center shadow-2xl border border-white/40"
        >
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg animate-bounce-slow">
              <span className="text-5xl text-white">✓</span>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-800 mb-3">Account Created! 🎉</h2>
          <p className="text-lg text-gray-600 mb-2">
            Welcome, <span className="font-semibold text-purple-600">{name}</span>!
          </p>
          <p className="text-gray-500 mb-6">Registered as {roleLabels[role] || role}</p>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-green-700 font-medium">✅ Your account has been created successfully!</p>
            <p className="text-green-600 text-sm mt-1">Redirecting to your dashboard...</p>
          </div>

          <div className="space-y-3">
            <p className="text-gray-500 text-sm">
              Redirecting in <span className="font-bold text-purple-600 text-lg">{countdown}</span> seconds...
            </p>
            <button
              onClick={() => navigate(`/${role}`, { replace: true })}
              className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-medium text-lg active:scale-95 shadow-md"
            >
              Go to Dashboard Now →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden bg-gradient-to-tr from-purple-50/50 via-pink-50/30 to-blue-50/50">
      {/* Decorative background blobs */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-10 left-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>

      {/* Main glass card container */}
      <div className="relative w-full max-w-6xl min-h-[720px] md:h-[650px] rounded-3xl overflow-hidden glass border border-white/50 shadow-2xl flex flex-col md:flex-row z-10">

        {/* Centered Logo Bridge */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none hidden md:block">
          <div className="w-21 h-21 rounded-full bg-white shadow-2xl border border-purple-100 flex items-center justify-center p-0.1 animate-bounce-slow">
            <img src="/logo.svg" alt="AutismCare Logo" className="h-24 w-auto" />
          </div>
        </div>

        {/* DESKTOP SLIDING OVERLAY PANEL */}
        <motion.div
          className="hidden md:flex absolute top-0 bottom-0 w-1/2 z-20 text-white flex-col items-center justify-center p-12 text-center overflow-hidden"
          animate={{ x: mode === 'login' ? '100%' : '0%' }}
          transition={{ type: 'spring', stiffness: 90, damping: 16 }}
        >
          {/* Background with image and overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/auth.jpg"
              alt="Care Illustration"
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay to maintain brand colors and readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/65 via-pink-500/65 to-indigo-600/65"></div>
          </div>

          {/* Animated background bubbles inside the sliding panel */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full filter blur-lg -translate-x-10 -translate-y-10 z-0"></div>
          <div className="absolute bottom-0 right-0 w-44 h-44 bg-white/10 rounded-full filter blur-lg translate-x-12 translate-y-12 z-0"></div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.div
                key="welcome-register"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6 relative z-10"
              >
                {/* Remove the separate img tag since it's now in the background */}
                <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">New to AutismCare?</h2>
                <p className="text-purple-100 leading-relaxed text-lg max-w-sm drop-shadow-md">
                  Create an account to join a collaborative environment for Parents, Teachers, and Healthcare professionals.
                </p>
                <button
                  onClick={() => {
                    setError('');
                    navigate('/register');
                  }}
                  className="mt-4 px-8 py-3 bg-white text-purple-600 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Create Account
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="welcome-login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-6 relative z-10"
              >
                {/* Remove the separate img tag since it's now in the background */}
                <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-lg">Welcome Back!</h2>
                <p className="text-purple-100 leading-relaxed text-lg max-w-sm drop-shadow-md">
                  Log in to keep tracking evaluations, coordinating lessons, or updating care plans.
                </p>
                <button
                  onClick={() => {
                    setError('');
                    navigate('/login');
                  }}
                  className="mt-4 px-8 py-3 bg-white text-purple-600 rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
                >
                  Sign In
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* MOBILE TOGGLE HEADER */}
        <div className="flex md:hidden w-full bg-white/40 border-b border-white/20 p-2 justify-around items-center z-25">
          <button
            onClick={() => navigate('/login')}
            className={`w-1/2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${mode === 'login' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600'
              }`}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className={`w-1/2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${mode === 'register' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600'
              }`}
          >
            Register
          </button>
        </div>

        {/* LOGIN FORM SECTION */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center min-h-[500px] md:min-h-0">
          <AnimatePresence mode="wait">
            {mode === 'login' && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="mb-6 block md:hidden text-center">
                  <img src="/logo.svg" alt="Logo" className="h-16 mx-auto mb-2 animate-bounce-slow" />
                  <h3 className="text-xl font-bold text-gray-800">Welcome Back</h3>
                </div>

                <div className="hidden md:block mb-8">
                  <h2 className="text-3xl font-extrabold text-gray-800">Sign In</h2>
                  <p className="text-gray-500 mt-1.5 text-sm">Access your care ecosystem dashboard</p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg mb-6 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showLoginPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || loginSuccess}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </button>

                  <div className="relative my-4 flex items-center justify-center">
                    <span className="absolute w-full border-t border-gray-200"></span>
                    <span className="relative px-3 bg-white/90 text-xs text-gray-500 rounded-full">
                      Or continue with
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn()}
                    disabled={googleLoading}
                    className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2.5 transition-all duration-300 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                </form>

                <p className="mt-6 text-center text-xs text-gray-500 md:hidden">
                  New to AutismCare?{' '}
                  <button onClick={() => navigate('/register')} className="text-purple-600 font-bold hover:underline">
                    Create Account
                  </button>
                </p>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="text-xs text-gray-500 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
                  >
                    ← Back to Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* REGISTER FORM SECTION */}
        <div className="w-full md:w-1/2 p-6 md:p-12 flex flex-col justify-center min-h-[500px] md:min-h-0">
          <AnimatePresence mode="wait">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.4 }}
                className="w-full"
              >
                <div className="mb-4 block md:hidden text-center">
                  <img src="/logo.svg" alt="Logo" className="h-16 mx-auto mb-2 animate-bounce-slow" />
                  <h3 className="text-xl font-bold text-gray-800">Create Account</h3>
                </div>

                <div className="hidden md:block mb-6">
                  <h2 className="text-3xl font-extrabold text-gray-800">Sign Up</h2>
                  <p className="text-gray-500 mt-1 text-sm">Join our specialized workspace today</p>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded-r-lg mb-4 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  {/* Custom Role Grid Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      I am a...
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(roleConfig).map(([roleKey, config]) => {
                        const isSelected = role === roleKey;
                        return (
                          <button
                            key={roleKey}
                            type="button"
                            onClick={() => setRole(roleKey)}
                            className={`py-3 px-1 rounded-xl text-center border text-xs font-medium transition-all duration-300 flex flex-col items-center justify-center gap-2 cursor-pointer ${isSelected
                                ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20 scale-[1.03]'
                                : 'bg-white/60 border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            <img
                              src={config.icon}
                              alt={config.alt}
                              className="w-10 h-10 object-contain"
                            />
                            <span>{config.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="your name"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </button>

                  <div className="relative my-2 flex items-center justify-center">
                    <span className="absolute w-full border-t border-gray-200"></span>
                    <span className="relative px-3 bg-white/90 text-xs text-gray-500 rounded-full">
                      Or continue with
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn(role)}
                    disabled={googleLoading}
                    className="w-full py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 shadow-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google
                  </button>
                </form>

                <p className="mt-4 text-center text-xs text-gray-500 md:hidden">
                  Already have an account?{' '}
                  <button onClick={() => navigate('/login')} className="text-purple-600 font-bold hover:underline">
                    Sign In
                  </button>
                </p>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => navigate('/')}
                    className="text-xs text-gray-500 hover:text-purple-600 transition-colors inline-flex items-center gap-1"
                  >
                    ← Back to Home
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export default AuthPage;