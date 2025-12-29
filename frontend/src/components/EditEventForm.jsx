import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Save, Lock, Eye } from 'lucide-react';
import io from 'socket.io-client';
import { API_URL } from '../config';

const EditEventForm = ({ currentUser }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ title: '', eventDate: '', description: '' });
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // ניהול נעילה
    const [isLocked, setIsLocked] = useState(false);
    const [lockedBy, setLockedBy] = useState('');
    
    // Ref ל-Socket כדי לא ליצור כפילויות
    const socketRef = useRef(null);

    // פונקציה לטעינת פרטי האירוע
    const fetchEvent = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/events/${eventId}`);
            setFormData({
                title: res.data.title,
                eventDate: res.data.event_date ? res.data.event_date.split('T')[0] : '', 
                description: res.data.description || ''
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setMessage('שגיאה בטעינת הנתונים');
            setLoading(false);
        }
    };

    // חיבור ל-Socket וניהול נעילות
    useEffect(() => {
        fetchEvent();

        if (currentUser?.id) {
            // יצירת חיבור
            if (!socketRef.current) {
                socketRef.current = io(API_URL, { transports: ['websocket'] });
            }
            const socket = socketRef.current;

            // 1. בקשת נעילה (אני רוצה לערוך)
            socket.emit('request_edit_lock', { 
                eventId, 
                userId: currentUser.id,
                email: currentUser.email || currentUser.full_name 
            });

            // 2. קבלת תשובה מהשרת האם הצלחנו לנעול
            socket.on('lock_status', ({ isLocked, lockedBy }) => {
                if (isLocked) {
                    setIsLocked(true);
                    setLockedBy(lockedBy);
                    setMessage(`🔒 מצב צפייה: ${lockedBy} עורך כרגע את האירוע.`);
                } else {
                    setIsLocked(false);
                }
            });

            // 3. Observer - האזנה לשינויים בזמן אמת
            // אם מי שעורך שמר שינויים, אנחנו נראה אותם מיד גם אם אנחנו נעולים
            socket.on('data_changed', () => {
                console.log('🔄 התקבל עדכון נתונים - מרענן תצוגה...');
                fetchEvent();
            });

            // ניקוי ביציאה
            return () => {
                socket.emit('release_edit_lock', eventId); // שחרור נעילה
                socket.off('lock_status');
                socket.off('data_changed');
            };
        }
    }, [eventId, currentUser]);

    // שמירת השינויים
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLocked) return; // הגנה

        try {
            await axios.put(`${API_URL}/api/events/${eventId}`, formData);
            // ה-Socket בשרת ישלח data_changed לכולם אוטומטית
            setMessage('עודכן בהצלחה! ✅ חוזר לדשבורד...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setMessage('שגיאה בעדכון');
        }
    };

    // פונקציה למחיקת אירוע
    const handleDelete = async () => {
        if (isLocked) return;
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/events/${eventId}`);
            setMessage('האירוע נמחק! מעביר לדשבורד...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setMessage('שגיאה במחיקת האירוע');
        }
    };

    // הגדרת סגנון אחיד לשדות הקלט (עם טיפול ב-Disabled)
    const inputClass = `w-full p-3 border rounded-xl outline-none transition duration-200 
        ${isLocked 
            ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-surface-800 dark:text-surface-500 dark:border-surface-700' 
            : 'bg-surface-50 border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400'
        }`;

    if (loading) return <div className="flex items-center justify-center min-h-screen text-purple-600 dark:text-purple-400">טוען...</div>;

    return (
        <div className="flex items-center justify-center min-h-screen p-6 font-sans transition-colors duration-300 bg-surface-50 dark:bg-surface-900" dir="rtl">
            <div className="relative w-full max-w-md p-8 bg-white border shadow-xl dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700 animate-fade-in">
                
                {/* חיווי ויזואלי לנעילה */}
                {isLocked && (
                    <div className="absolute top-4 left-4 flex items-center gap-1 px-3 py-1 text-xs font-bold text-red-600 border border-red-100 rounded-full bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50">
                        <Lock size={12} /> צפייה בלבד
                    </div>
                )}
                
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
                        {isLocked ? 'פרטי האירוע' : 'עריכת אירוע'}
                    </h2>
                    <button onClick={() => navigate('/')} className="p-2 transition rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-purple-600">
                        <ArrowRight size={20} />
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-3 rounded-lg text-center font-bold text-sm ${
                        message.includes('שגיאה') 
                            ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                            : message.includes('צפייה')
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">שם האירוע</label>
                        <input 
                            type="text" 
                            placeholder="שם האירוע" 
                            className={inputClass}
                            value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})} 
                            required 
                            disabled={isLocked}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">תאריך</label>
                        <input 
                            type="date" 
                            className={inputClass}
                            value={formData.eventDate} 
                            onChange={e => setFormData({...formData, eventDate: e.target.value})} 
                            required 
                            disabled={isLocked}
                        />
                    </div>

                    <div>
                        <label className="block mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">תיאור</label>
                        <textarea 
                            placeholder="תיאור חופשי..." 
                            rows="4"
                            className={inputClass}
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})} 
                            disabled={isLocked}
                        />
                    </div>

                    {!isLocked && (
                        <div className="pt-4 space-y-3">
                            <button type="submit" className="flex items-center justify-center w-full gap-2 py-3.5 font-bold text-white transition bg-purple-600 shadow-lg rounded-xl hover:bg-purple-700 shadow-purple-200 dark:shadow-none active:scale-95">
                                <Save size={18} /> שמור שינויים
                            </button>

                            <button 
                                type="button" 
                                onClick={handleDelete} 
                                className="flex items-center justify-center w-full gap-2 py-3.5 font-bold transition border rounded-xl bg-red-50 border-red-100 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/40 active:scale-95"
                            >
                                <Trash2 size={18} /> מחק אירוע
                            </button>
                        </div>
                    )}

                    {isLocked && (
                        <div className="mt-4 text-center">
                            <span className="flex items-center justify-center gap-1 text-xs text-surface-400">
                                <Eye size={12}/> אתה במצב צפייה. השינויים יתעדכנו אוטומטית.
                            </span>
                        </div>
                    )}
                </form>

                <button onClick={() => navigate('/')} className="block w-full mt-6 text-sm text-center transition text-surface-400 hover:text-purple-600 dark:text-surface-500 dark:hover:text-purple-400">
                    ביטול וחזרה לדשבורד
                </button>
            </div>
        </div>
    );
};

export default EditEventForm;