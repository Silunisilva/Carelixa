import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle, currentUser, authLoading } = useAuth();

  // If already logged in, redirect to their dashboard
  useEffect(() => {
    if (!authLoading && currentUser) {
      navigate(`/${currentUser.role}`, { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      setLoading(false);
      setLoginSuccess(true);
      // Navigate immediately with replace to prevent back-button returning to login
      navigate(`/${user.role || 'parent'}`, { replace: true });
    } catch (err) {
      console.error('Login error', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      const user = await loginWithGoogle();
      setGoogleLoading(false);
      setLoginSuccess(true);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      console.error('Google sign-in error', err);
      setError(err.message || 'Failed to sign in with Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="glass p-8 max-w-md w-full relative z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img src="/logo.svg" alt="AutismCare Logo" className="h-46 w-auto animate-bounce-slow" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {loginSuccess && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
              <p className="text-sm flex items-center gap-2">
                <span className="text-xl">✓</span>
                Welcome back! Redirecting to your dashboard...
              </p>
            </div>
          )}

          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">📧</span>
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-3 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:border-purple-300 focus:scale-[1.02]"
              />
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="text-lg">🔒</span>
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-lg glass border border-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-300 hover:border-purple-300 focus:scale-[1.02]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || loginSuccess}
            className="w-full py-3 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 text-white rounded-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 font-medium text-lg hover:from-purple-600 hover:via-pink-600 hover:to-purple-600 active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              {loginSuccess ? 'Welcome back!' : loading ? 'Signing In...' : 'Sign In'}
              <span className="text-xl">{loginSuccess ? '✓' : loading ? '⏳' : '→'}</span>
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white/80 text-gray-500">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-medium flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {googleLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </form>

        <div className="mt-6 space-y-4">
          <p className="text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-600 font-semibold hover:text-pink-600 transition-colors">
              Sign up
            </Link>
          </p>

          <Link
            to="/"
            className="block text-center text-gray-600 hover:text-purple-600 transition-all hover:scale-105 font-medium"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
