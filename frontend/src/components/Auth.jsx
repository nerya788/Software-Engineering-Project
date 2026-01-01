import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, User, Heart, Users, Key } from 'lucide-react';
import { API_URL } from '../config'; // ✅ תיקון: ייבוא Named Import

export default function Auth({ onLogin }) {
  const { isDarkMode } = useTheme();
  
  // Toggle between Login and Sign Up
  const [isLogin, setIsLogin] = useState(true);
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // --- New Partner States ---
  const [isPartner, setIsPartner] = useState(false);
  const [weddingCode, setWeddingCode] = useState('');
  // --------------------------

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register';
      
      // ✅ תיקון: שימוש ישיר במשתנה API_URL
      const url = `${API_URL}${endpoint}`;
      
      // Prepare payload
      const payload = { email, password };
      
      if (!isLogin) {
        payload.fullName = fullName;
        
        // Add partner data if applicable
        if (isPartner) {
            payload.isPartner = true;
            payload.weddingCode = weddingCode;
        }
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Login successful
      if (onLogin) onLogin(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-pink-50 text-gray-900'
    }`}>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl transition-all duration-300 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-pink-100'
      }`}>
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-pink-100 text-pink-500'
          }`}>
            <Heart size={32} fill={isDarkMode ? "currentColor" : "none"} />
          </div>
          <h1 className="text-3xl font-bold mb-2">Wedding Planner</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLogin ? 'Welcome back! Please login.' : 'Start planning your dream wedding.'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name (Register Only) */}
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required={!isLogin}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                    isDarkMode 
                      ? 'bg-gray-700 border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400' 
                      : 'bg-white border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                  }`}
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                }`}
                placeholder="you@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 focus:ring-purple-500 focus:border-purple-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                }`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* --- Partner Section (Register Only) --- */}
          {!isLogin && (
            <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              {/* Checkbox */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input 
                    type="checkbox"
                    checked={isPartner}
                    onChange={(e) => setIsPartner(e.target.checked)}
                    className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                />
                <div className="flex items-center space-x-2">
                    <Users size={18} className="text-gray-500"/>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Join as a Partner
                    </span>
                </div>
              </label>
              
              <p className={`text-xs mt-1 ml-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Check this if you are a parent, friend, or helper joining an existing wedding.
              </p>

              {/* Conditional Input for Wedding Code */}
              {isPartner && (
                  <div className="mt-3 ml-8 animate-fadeIn">
                      <label className="block text-xs font-semibold mb-1 uppercase tracking-wide">
                          Enter Wedding Code
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            required={isPartner}
                            value={weddingCode}
                            onChange={(e) => setWeddingCode(e.target.value)}
                            placeholder="e.g. WED-8429"
                            className={`w-full pl-9 pr-4 py-2 text-sm rounded-md border focus:ring-2 focus:outline-none ${
                                isDarkMode 
                                ? 'bg-gray-600 border-gray-500 focus:border-purple-500 text-white' 
                                : 'bg-white border-gray-300 focus:border-pink-500'
                            }`}
                        />
                      </div>
                  </div>
              )}
            </div>
          )}
          {/* -------------------------------------- */}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all transform active:scale-95 ${
              loading ? 'opacity-70 cursor-not-allowed' : 
              isDarkMode 
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-900/30' 
                : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200'
            }`}
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setIsPartner(false); // Reset partner state on toggle
            }}
            className={`text-sm hover:underline ${
              isDarkMode ? 'text-purple-400' : 'text-pink-600'
            }`}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
        
        {/* Forgot Password Link */}
        {isLogin && (
            <div className="mt-2 text-center">
                <button 
                   className={`text-xs ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
                   onClick={() => alert('Feature coming soon!')}
                >
                    Forgot Password?
                </button>
            </div>
        )}

      </div>
    </div>
  );
}