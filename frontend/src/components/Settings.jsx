import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Settings = ({ currentUser, onUpdateUser }) => {
  // אתחול המצב לפי הנתונים הקיימים
  const [days, setDays] = useState(currentUser?.settings?.notification_days ?? 1);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // עדכון התצוגה אם המשתמש הראשי משתנה (למשל, אחרי שמירה)
  useEffect(() => {
    if (currentUser?.settings?.notification_days !== undefined) {
      setDays(currentUser.settings.notification_days);
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:4000/api/users/${currentUser.id}/settings`, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center" dir="rtl">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
        
        <button onClick={() => navigate('/')} className="flex items-center text-gray-500 hover:text-purple-600 mb-6 transition">
          <ArrowRight size={20} className="ml-1" />
          חזרה לדשבורד
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">⚙️ הגדרות התראות</h2>
        
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
      </div>
    </div>
  );
};

export default Settings;