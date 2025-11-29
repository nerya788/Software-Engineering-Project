import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditEventForm = ({ currentUser }) => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ title: '', eventDate: '', description: '' });
    const [message, setMessage] = useState('');

    // טעינת פרטי האירוע
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:4000/api/events/${eventId}`);
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
            await axios.put(`http://localhost:4000/api/events/${eventId}`, formData);
            setMessage('עודכן בהצלחה! חוזר לדשבורד...');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setMessage('שגיאה בעדכון');
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto bg-white rounded shadow mt-10">
            <h2 className="text-2xl font-bold mb-4">עריכת אירוע</h2>
            {message && <div className="text-blue-600 mb-4">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                    type="text" placeholder="שם האירוע" className="w-full border p-2"
                    value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required 
                />
                <input 
                    type="date" className="w-full border p-2"
                    value={formData.eventDate} onChange={e => setFormData({...formData, eventDate: e.target.value})} required 
                />
                <textarea 
                    placeholder="תיאור" className="w-full border p-2"
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} 
                />
                <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded w-full">שמור שינויים</button>
            </form>
            <button onClick={() => navigate('/')} className="block mt-4 text-center text-gray-500 w-full">ביטול</button>
        </div>
    );
};

export default EditEventForm;