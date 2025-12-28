import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { API_URL } from '../config';

const Settings = ({ currentUser, onUpdateUser }) => {
  // אתחול המצב לפי הנתונים הקיימים
  const [days, setDays] = useState(currentUser?.settings?.notification_days ?? 1);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'password'
  const navigate = useNavigate();

  // עדכון התצוגה אם המשתמש הראשי משתנה
  useEffect(() => {
    if (currentUser?.settings?.notification_days !== undefined) {
      setDays(currentUser.settings.notification_days);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const res = await axios.put(`${API_URL}/api/users/${currentUser.id}/settings`, {
        notificationDays: days
      });
      
      if (onUpdateUser) {
          onUpdateUser(res.data);
      }

      setMessage('ההגדרות נשמרו בהצלחה! מעדכן...');
      
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      console.error(err);
      setMessage('שגיאה בשמירת ההגדרות: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage('');
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('הסיסמאות לא תואמות');
      return;
    }
    
    if (passwordForm.newPassword.length < 4) {
      setPasswordMessage('הסיסמה חייבת להכיל לפחות 4 תווים');
      return;
    }
    
    try {
      await axios.put(`${API_URL}/api/users/${currentUser.id}/password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setPasswordMessage('הסיסמה שונתה בהצלחה! ✅');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      setTimeout(() => {
        setPasswordMessage('');
      }, 3000);
    } catch (err) {
      setPasswordMessage('שגיאה בשינוי סיסמה: ' + (err.response?.data?.message || err.message));
    }
  };

  // סגנון אחיד לשדות קלט
  const inputClass = "w-full p-3 border rounded-xl outline-none transition duration-200 bg-surface-50 border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white";

  return (
    <div className="flex items-center justify-center min-h-screen p-6 transition-colors duration-300 font-sans bg-surface-50 dark:bg-surface-900" dir="rtl">
      <div className="w-full max-w-md p-8 bg-white border shadow-lg dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700">
        
        <button onClick={() => navigate('/')} className="flex items-center mb-6 transition text-surface-500 dark:text-surface-400 hover:text-purple-600 dark:hover:text-purple-400">
          <ArrowRight size={20} className="ml-1" />
          חזרה לדשבורד
        </button>

        <h2 className="mb-6 text-2xl font-bold text-surface-800 dark:text-surface-100">⚙️ הגדרות</h2>
        
        {/* טאבים */}
        <div className="flex gap-2 mb-6 border-b border-surface-200 dark:border-surface-700">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'notifications' 
                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
            }`}
          >
            התראות
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'password' 
                ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400' 
                : 'text-surface-500 dark:text-surface-400 hover:text-surface-700 dark:hover:text-surface-200'
            }`}
          >
            החלפת סיסמה
          </button>
        </div>

        {activeTab === 'notifications' ? (
          <div className="animate-fade-in">
            <div className="mb-8">
              <label className="block mb-3 font-medium text-surface-700 dark:text-surface-300">מתי תרצה לקבל תזכורת לאירוע?</label>
              <select 
                value={days} 
                onChange={(e) => setDays(Number(e.target.value))}
                className={inputClass}
              >
                <option value={0}>ביום האירוע עצמו (0 ימים)</option>
                <option value={1}>יום אחד לפני (מומלץ)</option>
                <option value={2}>יומיים לפני</option>
                <option value={3}>3 ימים לפני</option>
                <option value={7}>שבוע לפני</option>
              </select>
              <p className="mt-2 text-sm text-surface-400">
                ההתראה תופיע בפעמון בדשבורד.
              </p>
            </div>

            <button 
              onClick={handleSave}
              className="w-full py-4 font-bold text-white transition bg-purple-600 shadow-lg rounded-xl hover:bg-purple-700 shadow-purple-200 dark:shadow-none"
            >
              שמור שינויים
            </button>

            {message && (
              <div className={`mt-6 text-center font-bold p-3 rounded-lg ${message.includes('שגיאה') ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                {message}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block mb-2 font-medium text-surface-700 dark:text-surface-300">סיסמה נוכחית</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-surface-700 dark:text-surface-300">סיסמה חדשה</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={inputClass}
                  required
                  minLength={4}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-surface-700 dark:text-surface-300">אישור סיסמה חדשה</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={inputClass}
                  required
                  minLength={4}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 font-bold text-white transition bg-purple-600 shadow-lg rounded-xl hover:bg-purple-700 shadow-purple-200 dark:shadow-none"
              >
                שנה סיסמה
              </button>
            </form>

            {passwordMessage && (
              <div className={`mt-6 text-center font-bold p-3 rounded-lg ${
                passwordMessage.includes('שגיאה') || passwordMessage.includes('לא תואמות') || passwordMessage.includes('חייבת')
                  ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {passwordMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;