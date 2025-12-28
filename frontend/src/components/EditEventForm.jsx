import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Save } from 'lucide-react'; // הוספתי אייקונים ליופי
import { API_URL } from '../config';

const EditEventForm = ({ currentUser }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ title: '', eventDate: '', description: '' });
    const [message, setMessage] = useState('');

    // טעינת פרטי האירוע
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`${API_URL}/api/events/${eventId}`);
                setFormData({
                    title: res.data.title,
                    eventDate: res.data.event_date ? res.data.event_date.split('T')[0] : '', 
                    description: res.data.description || ''
                });
            } catch (err) {
                console.error(err);
            }
        };
        if (currentUser) fetchEvent();
    }, [eventId, currentUser]);

    // שמירת השינויים
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`${API_URL}/api/events/${eventId}`, formData);
            setMessage('עודכן בהצלחה! חוזר לדשבורד...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setMessage('שגיאה בעדכון');
        }
    };

    // פונקציה למחיקת אירוע
    const handleDelete = async () => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק את האירוע?')) return;
        
        try {
            await axios.delete(`${API_URL}/api/events/${eventId}`);
            setMessage('האירוע נמחק! מעביר לדשבורד...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setMessage('שגיאה במחיקת האירוע');
        }
    };

    // הגדרת סגנון אחיד לשדות הקלט
    const inputClass = "w-full p-3 border rounded-xl outline-none transition duration-200 bg-surface-50 border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400";

    return (
        <div className="flex items-center justify-center min-h-screen p-6 transition-colors duration-300 font-sans bg-surface-50 dark:bg-surface-900" dir="rtl">
            <div className="w-full max-w-md p-8 bg-white border shadow-xl dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700 animate-fade-in">
                
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
                        עריכת אירוע
                    </h2>
                    <button onClick={() => navigate('/')} className="p-2 transition rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-400 hover:text-purple-600">
                        <ArrowRight size={20} />
                    </button>
                </div>

                {message && (
                    <div className={`mb-6 p-3 rounded-lg text-center font-bold text-sm ${message.includes('שגיאה') ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
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
                        />
                    </div>

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
                </form>

                <button onClick={() => navigate('/')} className="block w-full mt-6 text-sm text-center transition text-surface-400 hover:text-purple-600 dark:text-surface-500 dark:hover:text-purple-400">
                    ביטול וחזרה לדשבורד
                </button>
            </div>
        </div>
    );
};

export default EditEventForm;