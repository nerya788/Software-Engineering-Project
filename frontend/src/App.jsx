import { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { API_URL } from './config';
import BudgetDashboard from './components/BudgetDashboard.jsx';

// ייבוא הרכיבים
import Dashboard from './components/Dashboard.jsx';
import GuestList from './components/GuestList.jsx';
import EditEventForm from './components/EditEventForm.jsx';
import Settings from './components/Settings.jsx';

function AuthComponent({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register | forgot
  
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [message, setMessage] = useState('');

  const handleRegisterChange = (e) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleForgotChange = (e) => setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users/register`, registerForm);
      setMessage(`User registered! Please login.`);
      setMode('login');
      setRegisterForm({ email: '', password: '', fullName: '' });
    } catch (err) {
      setMessage('Error register: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/users/login`, loginForm);
      console.log('✅ התחברות הצליחה:', res.data);
      if (onLogin && res.data) {
        // וודא שיש id למשתמש
        if (!res.data.id && res.data._id) {
          res.data.id = String(res.data._id);
        }
        console.log('🔄 מעדכן currentUser:', res.data);
        onLogin(res.data);
      }
      setMessage('');
    } catch (err) {
      console.error('❌ שגיאה בהתחברות:', err);
      setMessage('Error login: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/api/users/forgot`, forgotForm);
      if (res.data.password) {
        // מצב פיתוח - מציג את הסיסמה החדשה
        setMessage(`סיסמה חדשה נוצרה! הסיסמה החדשה היא: ${res.data.password}`);
      } else {
        // מצב ייצור - הסיסמה נשלחה במייל
        setMessage('אם המייל קיים, נשלחה סיסמה חדשה למייל שלך. אנא בדוק את תיבת הדואר הנכנס.');
      }
      setMode('login');
      setForgotForm({ email: '' });
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.message || 'Error'));
    }
  };


  return (
    <div className="app flex items-center justify-center min-h-screen bg-gray-100">
      <div className="auth-card card w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-center text-purple-600 mb-2">Wedding Planner</h1>
        
        {mode === 'login' ? (
          <>
            <form className="space-y-4" onSubmit={handleLogin}>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="email" name="email" placeholder="אימייל" value={loginForm.email} onChange={handleLoginChange} required />
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="password" name="password" placeholder="סיסמה" value={loginForm.password} onChange={handleLoginChange} required />
              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium transition">התחבר</button>
            </form>
            <div className="mt-4 space-y-2">
              <button type="button" className="w-full text-sm text-purple-600 hover:text-purple-800 underline" onClick={() => setMode('forgot')}>שכחתי סיסמה</button>
              <div className="text-center text-sm text-gray-500">
                אין לך חשבון?{' '}
                <button type="button" className="text-purple-600 hover:text-purple-800 font-medium underline" onClick={() => setMode('register')}>
                  הירשם כאן
                </button>
              </div>
            </div>
          </>
        ) : mode === 'register' ? (
          <>
            <form className="space-y-4" onSubmit={handleRegister}>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="text" name="fullName" placeholder="שם מלא" value={registerForm.fullName} onChange={handleRegisterChange} />
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="email" name="email" placeholder="אימייל" value={registerForm.email} onChange={handleRegisterChange} required />
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="password" name="password" placeholder="סיסמה" value={registerForm.password} onChange={handleRegisterChange} required />
              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium transition">הירשם</button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              יש לך כבר חשבון?{' '}
              <button type="button" className="text-purple-600 hover:text-purple-800 font-medium underline" onClick={() => setMode('login')}>
                התחבר כאן
              </button>
            </div>
          </>
        ) : mode === 'forgot' ? (
          <>
            <form className="space-y-4" onSubmit={handleForgot}>
              <p className="text-sm text-gray-600 mb-2">הזן את כתובת האימייל שלך ונשלח לך סיסמה חדשה</p>
              <input className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none" type="email" name="email" placeholder="אימייל" value={forgotForm.email} onChange={handleForgotChange} required />
              <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 font-medium transition">שלח סיסמה חדשה</button>
            </form>
            <div className="mt-4 text-center">
              <button type="button" className="text-sm text-purple-600 hover:text-purple-800 underline" onClick={() => setMode('login')}>חזרה להתחברות</button>
            </div>
          </>
        ) : null}
        
        {message && <p className="mt-4 text-center text-red-500">{message}</p>}
      </div>
    </div>
  );
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  
  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<AuthComponent onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard currentUser={currentUser} onLogout={handleLogout} />} />
        <Route path="/events/:eventId/guests" element={<GuestList />} />
        <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
        <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
        
        {/* התיקון כאן: העברת הפונקציה לעדכון המשתמש */}
        <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateUser={setCurrentUser} />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;