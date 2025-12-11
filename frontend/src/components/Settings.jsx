import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { API_URL } from '../config'; // <--- 1. ייבוא הכתובת

const Settings = ({ currentUser, onUpdateUser }) => {
  // אתחול המצב לפי הנתונים הקיימים
  const [days, setDays] = useState(currentUser?.settings?.notification_days ?? 1);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'password'
  const navigate = useNavigate();

  // עדכון התצוגה אם המשתמש הראשי משתנה (למשל, אחרי שמירה)
  useEffect(() => {
    if (currentUser?.settings?.notification_days !== undefined) {
      setDays(currentUser.settings.notification_days);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      // 2. שימוש ב-API_URL
      const res = await axios.put(`${API_URL}/api/users/${currentUser.id}/settings`, {
        notificationDays: days
      });
      
      // עדכון הזיכרון הראשי של האפליקציה במידע החדש
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
      // 3. שימוש ב-API_URL
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        
        <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-purple-600 mb-6 transition">
          <ArrowRight size={20} className="ml-1" />
          חזרה לדשבורד
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ הגדרות</h2>
        
        {/* טאבים */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'notifications' 
                ? 'border-b-2 border-purple-600 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            התראות
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === 'password' 
                ? 'border-b-2 border-purple-600 text-purple-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            החלפת סיסמה
          </button>
        </div>

        {activeTab === 'notifications' ? (
          <>
            <div className="mb-8">
              <label className="block mb-3 font-medium text-gray-700">מתי תרצה לקבל תזכורת לאירוע?</label>
              <select 
                value={days} 
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition"
              >
                <option value={0}>ביום האירוע עצמו (0 ימים)</option>
                <option value={1}>יום אחד לפני (מומלץ)</option>
                <option value={2}>יומיים לפני</option>
                <option value={3}>3 ימים לפני</option>
                <option value={7}>שבוע לפני</option>
              </select>
              <p className="text-sm text-gray-400 mt-2">
                ההתראה תופיע בפעמון בדשבורד.
              </p>
            </div>

            <button 
              onClick={handleSave}
              className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200"
            >
              שמור שינויים
            </button>

            {message && (
              <div className={`mt-6 text-center font-bold p-3 rounded-lg ${message.includes('שגיאה') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {message}
              </div>
            )}
          </>
        ) : (
          <>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block mb-2 font-medium text-gray-700">סיסמה נוכחית</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition"
                  required
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">סיסמה חדשה</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition"
                  required
                  minLength={4}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium text-gray-700">אישור סיסמה חדשה</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-purple-500 outline-none transition"
                  required
                  minLength={4}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200"
              >
                שנה סיסמה
              </button>
            </form>

            {passwordMessage && (
              <div className={`mt-6 text-center font-bold p-3 rounded-lg ${
                passwordMessage.includes('שגיאה') || passwordMessage.includes('לא תואמות') || passwordMessage.includes('חייבת')
                  ? 'bg-red-50 text-red-600' 
                  : 'bg-green-50 text-green-600'
              }`}>
                {passwordMessage}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;