import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Save, User, Mail, Bell, Moon, Sun, Copy, Check, Users, Key } from 'lucide-react';
import { API_URL } from '../config';

export default function Settings({ currentUser, onUpdateUser }) {
  const { isDarkMode, toggleTheme } = useTheme();
  
  // State for form fields
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [notificationDays, setNotificationDays] = useState(currentUser?.settings?.notification_days || 1);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false); // For copy feedback

  // בדיקה אם המשתמש הוא שותף
  const isPartner = currentUser?.isPartner || currentUser?.is_partner;

  // פונקציה להעתקת הקוד
  const copyToClipboard = () => {
    if (currentUser?.weddingCode) {
      navigator.clipboard.writeText(currentUser.weddingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token'); // Assuming you use token based auth or cookie
      // Note: In your current setup, you might be relying on cookies or just sending ID. 
      // Adjust headers if needed based on your auth implementation.
      
      const res = await fetch(`${API_URL}/api/users/${currentUser.id}`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          settings: {
            notification_days: notificationDays
          }
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Update failed');

      // Update parent state
      onUpdateUser(data); 
      setMessage('ההגדרות נשמרו בהצלחה! ✅');
      setTimeout(() => setMessage(''), 3000);

    } catch (err) {
      console.error(err);
      setMessage('שגיאה בשמירת הנתונים ❌');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8" dir="rtl">
      <h1 className="text-3xl font-bold mb-8 text-surface-800 dark:text-surface-100 flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-purple-600" />
        הגדרות חשבון
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* --- Sidebar / Navigation (Visual only for now) --- */}
        <div className="md:col-span-1 space-y-4">
          <div className="p-6 bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 text-center">
            <div className="w-20 h-20 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-300 mb-4">
              {fullName.charAt(0).toUpperCase()}
            </div>
            <h2 className="font-bold text-lg text-surface-800 dark:text-surface-100">{fullName}</h2>
            <p className="text-sm text-surface-500 dark:text-surface-400">{isPartner ? 'שותף מורשה' : 'מנהל אירוע'}</p>
          </div>
        </div>

        {/* --- Main Content --- */}
        <div className="md:col-span-2 space-y-6">

          {/* 1. Partner Management Section (Visible only to Main User) */}
          {!isPartner && (
            <div className="p-6 bg-gradient-to-r from-purple-50 to-white dark:from-surface-800 dark:to-surface-800 rounded-2xl shadow-sm border border-purple-100 dark:border-surface-700">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100 flex items-center gap-2">
                            <Users size={20} className="text-purple-600"/>
                            שיתוף גישה לחתונה
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
                            שתף את הקוד הזה עם בן/בת הזוג, הורים או מלווים כדי לתת להם גישה למשימות.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key size={18} className="text-gray-400" />
                        </div>
                        <input 
                            type="text" 
                            readOnly 
                            value={currentUser?.weddingCode || 'טוען קוד...'} 
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-900 border-2 border-purple-200 dark:border-surface-600 rounded-xl font-mono text-lg font-bold text-center tracking-widest text-purple-700 dark:text-purple-300 focus:outline-none"
                        />
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                            copied 
                            ? 'bg-green-500 text-white shadow-green-200' 
                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200 dark:shadow-none'
                        }`}
                    >
                        {copied ? <Check size={20} /> : <Copy size={20} />}
                        {copied ? 'הועתק!' : 'העתק'}
                    </button>
                </div>
            </div>
          )}

          {/* 2. General Settings Form */}
          <form onSubmit={handleSubmit} className="p-6 bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-100 dark:border-surface-700 space-y-6">
            <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100 mb-4">פרטים אישיים</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">שם מלא</label>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 border rounded-xl bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">כתובת אימייל</label>
                    <div className="relative">
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 border rounded-xl bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition"
                        />
                    </div>
                </div>
            </div>

            <hr className="border-surface-100 dark:border-surface-700 my-6" />

            <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100 mb-4">העדפות מערכת</h3>
            
            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-surface-700 rounded-lg shadow-sm">
                        {isDarkMode ? <Moon size={20} className="text-purple-400" /> : <Sun size={20} className="text-orange-400" />}
                    </div>
                    <div>
                        <p className="font-medium text-surface-800 dark:text-surface-100">מצב תצוגה</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                            {isDarkMode ? 'מצב לילה פעיל' : 'מצב יום פעיל'}
                        </p>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={toggleTheme}
                    className="px-4 py-2 text-sm font-medium bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-600 transition"
                >
                    החלף ערכת נושא
                </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-surface-700 rounded-lg shadow-sm">
                        <Bell size={20} className="text-purple-500" />
                    </div>
                    <div>
                        <p className="font-medium text-surface-800 dark:text-surface-100">התראות משימה</p>
                        <p className="text-xs text-surface-500 dark:text-surface-400">כמה ימים לפני הדד-ליין לקבל התראה?</p>
                    </div>
                </div>
                <select 
                    value={notificationDays}
                    onChange={(e) => setNotificationDays(Number(e.target.value))}
                    className="px-3 py-2 bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value={1}>יום אחד לפני</option>
                    <option value={2}>יומיים לפני</option>
                    <option value={3}>3 ימים לפני</option>
                    <option value={7}>שבוע לפני</option>
                </select>
            </div>

            <div className="pt-4">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full md:w-auto px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 dark:shadow-none transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {loading ? 'שומר...' : <><Save size={20} /> שמור שינויים</>}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl text-center font-medium animate-fade-in ${message.includes('שגיאה') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}

// Helper component for the header icon
const SettingsIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
);