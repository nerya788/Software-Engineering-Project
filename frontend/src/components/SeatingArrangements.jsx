import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { 
  Printer, Trash2, RotateCcw, Plus, Users, 
  Armchair, ArrowRight, GripVertical, X, CheckCircle2, AlertTriangle 
} from 'lucide-react';
import { API_URL } from '../config';

const SeatingArrangements = ({ currentUser }) => {
  const { eventId } = useParams();
  const socketRef = useRef(null);

  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedGuest, setDraggedGuest] = useState(null);
  
  // טופס
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(10);

  // --- טעינת נתונים ---
  const fetchData = async () => {
    try {
      const [guestsRes, tablesRes] = await Promise.all([
        axios.get(`${API_URL}/api/events/${eventId}/guests`),
        axios.get(`${API_URL}/api/events/${eventId}/tables`)
      ]);
      
      console.log("Guests loaded:", guestsRes.data.length); // בדיקה בקונסול
      setGuests(guestsRes.data || []);
      setTables(tablesRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading data:", err);
      setLoading(false);
    }
  };

useEffect(() => {
    fetchData(); // טעינה ראשונית

    // חיבור לסוקט
    if (!socketRef.current) {
        socketRef.current = io(API_URL, { transports: ['websocket'] });
    }

    const socket = socketRef.current;

    // 1. הצטרפות לחדר של האירוע הספציפי הזה
    socket.emit('join_event', eventId); 

    // 2. האזנה לשינויים
    const handleDataChange = (data) => {
        console.log("🔔 התקבל עדכון בזמן אמת:", data);
        fetchData(); // רענון הנתונים
    };

    socket.on('data_changed', handleDataChange);

    // ניקוי ביציאה מהעמוד
    return () => {
        socket.off('data_changed', handleDataChange);
        socket.disconnect();
        socketRef.current = null;
    };
  }, [eventId]); // תלות ב-eventId בלבד 
  

  // --- Handlers ---

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName) return;
    try {
      await axios.post(`${API_URL}/api/tables`, { 
          userId: currentUser.id, // חובה לשלוח!
          eventId, 
          name: newTableName, 
          capacity: parseInt(newTableCapacity) || 10 
      });
      setNewTableName('');
      setNewTableCapacity(10);
    } catch (err) { alert('שגיאה ביצירת שולחן'); }
  };

  const handleDeleteTable = async (tableId) => {
    if(!window.confirm('למחוק?')) return;
    try { await axios.delete(`${API_URL}/api/tables/${tableId}`); } 
    catch (err) { alert('שגיאה במחיקה'); }
  };

  const handleResetAndFix = async () => {
    if (!window.confirm('האם לאפס הכל?')) return;
    try {
        await axios.post(`${API_URL}/api/events/${eventId}/reset-seating`);
        fetchData();
    } catch (err) { alert('שגיאה באיפוס'); }
  };

  const handleSeatChange = async (guestId, tableId) => {
      // עדכון אופטימיסטי
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: tableId } : g));
      try {
        await axios.put(`${API_URL}/api/guests/${guestId}/seat`, { tableId });
      } catch (err) { fetchData(); }
  };

  const handleDrop = (tableId) => {
    if (draggedGuest && draggedGuest.table_id !== tableId) {
        handleSeatChange(draggedGuest.id, tableId);
        setDraggedGuest(null);
    }
  };

  // --- לוגיקת הצלה: הצגת כל האורחים שאינם משובצים ---
  // הסרנו את הבדיקה של rsvp_status כדי לראות את כולם
  const unseatedGuests = guests.filter(g => {
      // אם אין table_id או שהוא ריק
      if (!g.table_id) return true;
      // אם יש table_id אבל השולחן לא קיים ברשימה (באג זומבי)
      const tableExists = tables.some(t => t.id === g.table_id);
      return !tableExists;
  });

  const getGuestsForTable = (tid) => guests.filter(g => g.table_id === tid);

  if (loading) return <div className="p-10 text-center">טוען...</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-6 print:bg-white" dir="rtl">
      
      {/* Header */}
      <div className="max-w-[1600px] mx-auto mb-6 flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full"><ArrowRight/></Link>
            <h1 className="text-xl font-bold">סידורי הושבה ({guests.length} אורחים סה"כ)</h1>
        </div>
        
        <div className="flex gap-2">
             <button onClick={() => window.print()} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-bold print:hidden">הדפסה</button>
             <button onClick={handleResetAndFix} className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-bold border border-red-200 print:hidden">איפוס מלא</button>
        </div>

        <form onSubmit={handleAddTable} className="flex gap-2 print:hidden">
            <input type="text" placeholder="שם שולחן" className="px-3 py-2 border rounded-lg dark:bg-gray-700 w-32" value={newTableName} onChange={e => setNewTableName(e.target.value)} required />
            <input type="number" placeholder="מס'" className="px-2 py-2 border rounded-lg dark:bg-gray-700 w-16 text-center" value={newTableCapacity} onChange={e => setNewTableCapacity(e.target.value)} />
            <button className="bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700">+</button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto h-[calc(100vh-150px)]">
        
        {/* רשימת ממתינים */}
        <div className="w-full lg:w-1/4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col overflow-hidden print:hidden">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b font-bold flex justify-between">
                <span>ממתינים</span>
                <span className="bg-purple-100 text-purple-700 px-2 rounded-full text-xs flex items-center">{unseatedGuests.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar" onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(null)}>
                {unseatedGuests.map(guest => (
                    <div key={guest.id} draggable onDragStart={() => setDraggedGuest(guest)} className="p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm cursor-grab hover:border-purple-500">
                        <div className="flex justify-between">
                            <span className="font-bold text-sm">{guest.full_name}</span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-1.5 rounded">{guest.amount_invited}</span>
                        </div>
                        {/* Mobile select */}
                        <select className="mt-2 w-full text-xs p-1 border rounded dark:bg-gray-800 lg:hidden" onChange={(e)=>handleSeatChange(guest.id, e.target.value)} value="">
                            <option value="" disabled>בחר שולחן</option>
                            {tables.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                ))}
                {unseatedGuests.length === 0 && <div className="text-center p-4 text-gray-400 text-sm">ריק</div>}
            </div>
        </div>

        {/* שולחנות */}
        <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {tables.map(table => {
                    const seated = getGuestsForTable(table.id);
                    const count = seated.reduce((s, g) => s + (g.amount_invited || 1), 0);
                    return (
                        <div key={table.id} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(table.id)} className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl flex flex-col h-fit">
                            <div className="p-3 border-b flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-t-xl">
                                <div>
                                    <span className="font-bold">{table.name}</span>
                                    <span className={`text-xs mr-2 font-bold ${count >= table.capacity ? 'text-red-500' : 'text-green-500'}`}>{count}/{table.capacity}</span>
                                </div>
                                <button onClick={()=>handleDeleteTable(table.id)} className="text-gray-400 hover:text-red-500 print:hidden"><Trash2 size={14}/></button>
                            </div>
                            <div className="p-2 space-y-1 min-h-[100px]">
                                {seated.map(g => (
                                    <div key={g.id} draggable onDragStart={() => setDraggedGuest(g)} className="flex justify-between p-2 bg-white dark:bg-gray-700 border rounded shadow-sm text-sm cursor-grab">
                                        <span className="truncate w-3/4">{g.full_name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-1 rounded">{g.amount_invited}</span>
                                            <button onClick={()=>handleSeatChange(g.id, null)} className="text-gray-300 hover:text-red-500 print:hidden">×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
            {tables.length === 0 && <div className="text-center mt-20 text-gray-400">אין שולחנות</div>}
        </div>

      </div>
    </div>
  );
};

export default SeatingArrangements;