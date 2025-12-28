import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '../config';

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterChange = (e) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  const handleForgotChange = (e) => setForgotForm({ ...forgotForm, [e.target.name]: e.target.value });

  // פונקציה כללית לטיפול בשגיאות
  const handleError = (err, prefix) => {
    const errorMsg = err.response?.data?.message || 'אירעה שגיאה, נסה שנית';
    setMessage(`${prefix}: ${errorMsg}`);
    setIsLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/api/users/register`, registerForm);
      setMessage(`נרשמת בהצלחה! אנא התחבר.`);
      setMode('login');
      setRegisterForm({ email: '', password: '', fullName: '' });
      setIsLoading(false);
    } catch (err) { handleError(err, 'שגיאה בהרשמה'); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/login`, loginForm);
      if (onLogin && res.data) {
        if (!res.data.id && res.data._id) res.data.id = String(res.data._id);
        onLogin(res.data);
      }
    } catch (err) { handleError(err, 'שגיאה בהתחברות'); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/api/users/forgot`, forgotForm);
      if (res.data.password) {
        setMessage(`סיסמה חדשה: ${res.data.password}`);
      } else {
        setMessage('סיסמה חדשה נשלחה למייל שלך.');
      }
      setTimeout(() => { setMode('login'); setForgotForm({ email: '' }); }, 5000);
      setIsLoading(false);
    } catch (err) { handleError(err, 'שגיאה'); }
  };

  // עיצוב שדות קלט אחיד
  const InputClass = "w-full p-3 bg-surface-50 dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none text-surface-900 dark:text-white placeholder-surface-400 transition-colors";
  // עיצוב כפתור אחיד
  const ButtonClass = "w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-medium transition-all shadow-lg hover:shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white/80 dark:bg-surface-800/90 backdrop-blur-lg shadow-glass rounded-2xl border border-white/20">
        <h1 className="text-4xl font-bold text-center text-primary-600 dark:text-primary-400 mb-6 drop-shadow-sm">
          Wedding Planner
        </h1>

        {/* --- LOGIN FORM --- */}
        {mode === 'login' && (
          <div className="animate-fade-in">
            <form className="space-y-4" onSubmit={handleLogin}>
              <input className={InputClass} type="email" name="email" placeholder="אימייל" value={loginForm.email} onChange={handleLoginChange} required />
              <input className={InputClass} type="password" name="password" placeholder="סיסמה" value={loginForm.password} onChange={handleLoginChange} required />
              <button type="submit" className={ButtonClass} disabled={isLoading}>
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
            <div className="mt-6 flex flex-col space-y-3 text-center">
              <button type="button" className="text-sm text-primary-600 dark:text-primary-400 hover:underline" onClick={() => {setMessage(''); setMode('forgot');}}>
                שכחתי סיסמה
              </button>
              <div className="text-sm text-surface-500 dark:text-surface-400">
                אין לך חשבון?{' '}
                <button type="button" className="text-primary-600 dark:text-primary-400 font-bold hover:underline" onClick={() => {setMessage(''); setMode('register');}}>
                  הירשם כאן
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- REGISTER FORM --- */}
        {mode === 'register' && (
          <div className="animate-fade-in">
            <form className="space-y-4" onSubmit={handleRegister}>
              <input className={InputClass} type="text" name="fullName" placeholder="שם מלא" value={registerForm.fullName} onChange={handleRegisterChange} />
              <input className={InputClass} type="email" name="email" placeholder="אימייל" value={registerForm.email} onChange={handleRegisterChange} required />
              <input className={InputClass} type="password" name="password" placeholder="סיסמה" value={registerForm.password} onChange={handleRegisterChange} required />
              <button type="submit" className={ButtonClass} disabled={isLoading}>
                {isLoading ? 'נרשם...' : 'הירשם'}
              </button>
            </form>
            <div className="mt-6 text-center text-sm text-surface-500 dark:text-surface-400">
              יש לך כבר חשבון?{' '}
              <button type="button" className="text-primary-600 dark:text-primary-400 font-bold hover:underline" onClick={() => {setMessage(''); setMode('login');}}>
                התחבר כאן
              </button>
            </div>
          </div>
        )}

        {/* --- FORGOT FORM --- */}
        {mode === 'forgot' && (
          <div className="animate-fade-in">
            <form className="space-y-4" onSubmit={handleForgot}>
              <p className="text-sm text-surface-600 dark:text-surface-300 mb-2 text-center">הזן את האימייל שלך ונשלח לך סיסמה חדשה</p>
              <input className={InputClass} type="email" name="email" placeholder="אימייל" value={forgotForm.email} onChange={handleForgotChange} required />
              <button type="submit" className={ButtonClass} disabled={isLoading}>
                {isLoading ? 'שולח...' : 'שלח סיסמה חדשה'}
              </button>
            </form>
            <div className="mt-6 text-center">
              <button type="button" className="text-sm text-primary-600 dark:text-primary-400 hover:underline" onClick={() => {setMessage(''); setMode('login');}}>
                חזרה להתחברות
              </button>
            </div>
          </div>
        )}

        {/* --- MESSAGES --- */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm font-medium animate-pulse ${message.includes('הצלחה') || message.includes('חדשה') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}