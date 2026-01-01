// frontend/src/components/SeatingArrangements.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import io from 'socket.io-client';
import { API_URL } from '../config';

const SeatingArrangements = ({ currentUser }) => {
  const { eventId } = useParams();
  const socketRef = useRef(null);

  const [guests, setGuests] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedGuest, setDraggedGuest] = useState(null);

  // Form State
  const [newTableName, setNewTableName] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(10);

  useEffect(() => {
    fetchData();
    if (currentUser?.id && !socketRef.current) {
        socketRef.current = io(API_URL, { transports: ['websocket'] });
        socketRef.current.emit('register_user', currentUser.id);
        socketRef.current.on('data_changed', fetchData);
    }
    return () => { if(socketRef.current) socketRef.current.disconnect(); };
  }, [eventId, currentUser]);

  const fetchData = async () => {
    try {
      const [guestsRes, tablesRes] = await Promise.all([
        axios.get(`${API_URL}/api/events/${eventId}/guests`),
        axios.get(`${API_URL}/api/events/${eventId}/tables`)
      ]);
      setGuests(guestsRes.data);
      setTables(tablesRes.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    if (!newTableName) return;
    try {
      await axios.post(`${API_URL}/api/tables`, { eventId, name: newTableName, capacity: newTableCapacity });
      setNewTableName('');
      setNewTableCapacity(10);
    } catch (err) { alert('Error creating table'); }
  };

  const handleDeleteTable = async (tableId) => {
    if(!window.confirm('Delete this table? Guests will be unassigned.')) return;
    try { await axios.delete(`${API_URL}/api/tables/${tableId}`); } 
    catch (err) { alert('Error deleting table'); }
  };

  // ✅ New Feature: Clear all seating assignments
  const handleClearAll = async () => {
    if(!window.confirm('Are you sure you want to clear ALL seat assignments?')) return;
    try {
        // Send a request to clear seats (You might need a backend endpoint or loop calls)
        // For simplicity, we loop calls here, but a dedicated endpoint is better for performance.
        const seatedGuests = guests.filter(g => g.table_id);
        await Promise.all(seatedGuests.map(g => axios.put(`${API_URL}/api/guests/${g.id}/seat`, { tableId: null })));
    } catch (err) { alert('Error clearing seats'); }
  };

  const handleSeatChange = async (guestId, tableId) => {
      try {
        // Optimistic update
        setGuests(prev => prev.map(g => g.id === guestId ? { ...g, table_id: tableId } : g));
        await axios.put(`${API_URL}/api/guests/${guestId}/seat`, { tableId });
      } catch (err) {
          fetchData(); // Revert on error
          if (err.response?.data?.code === 'TABLE_FULL') alert('Table is full!');
      }
  };

  const handleDrop = (tableId) => {
    if (draggedGuest && draggedGuest.table_id !== tableId) {
        handleSeatChange(draggedGuest.id, tableId);
        setDraggedGuest(null);
    }
  };

  const unseatedGuests = guests.filter(g => !g.table_id && g.rsvp_status === 'attending');
  const getGuestsForTable = (tid) => guests.filter(g => g.table_id === tid);

  if (loading) return <div className="p-10 text-center animate-pulse">Loading seating...</div>;

  return (
    <div className="min-h-screen p-6 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100 print:bg-white print:p-0" dir="rtl">
      
      {/* Header - Hidden when printing */}
      <div className="flex flex-wrap items-center justify-between mb-8 max-w-[1600px] mx-auto print:hidden gap-4">
        <div className="flex items-center gap-4">
            <Link to="/" className="px-4 py-2 text-sm font-medium bg-white border rounded-full shadow-sm hover:bg-surface-50 dark:bg-surface-800 dark:border-surface-700">Back</Link>
            <h1 className="text-2xl font-bold">Seating Arrangements 🪑</h1>
        </div>
        
        <div className="flex items-center gap-2">
             {/* ✅ Button: Print */}
            <button onClick={() => window.print()} className="px-4 py-2 text-sm font-medium text-surface-600 bg-white border rounded-lg hover:bg-surface-50 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-700">
                🖨️ Print
            </button>
             {/* ✅ Button: Clear All */}
            <button onClick={handleClearAll} className="px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400">
                ❌ Clear All
            </button>
        </div>

        <form onSubmit={handleAddTable} className="flex gap-2 w-full md:w-auto">
            <input type="text" placeholder="Table Name" className="flex-1 px-4 py-2 text-sm border rounded-lg outline-none md:w-44 dark:bg-surface-800 dark:border-surface-700" value={newTableName} onChange={e => setNewTableName(e.target.value)} required />
            <input type="number" placeholder="Cap." className="w-20 px-4 py-2 text-sm border rounded-lg outline-none dark:bg-surface-800 dark:border-surface-700" value={newTableCapacity} onChange={e => setNewTableCapacity(e.target.value)} min="1" />
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700">+ Add</button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-[1600px] mx-auto h-[calc(100vh-140px)] print:h-auto print:block">
        
        {/* Sidebar: Unassigned (Hidden on Print) */}
        <div className="w-full lg:w-1/4 flex flex-col bg-white border rounded-xl shadow-sm dark:bg-surface-800 dark:border-surface-700 overflow-hidden print:hidden">
            <div className="p-4 border-b bg-surface-50 dark:bg-surface-700/50">
                <h3 className="font-bold">Unassigned ({unseatedGuests.length})</h3>
            </div>
            <div className="flex-1 p-2 overflow-y-auto space-y-2 bg-surface-50/50 dark:bg-surface-900/50" onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(null)}>
                {unseatedGuests.map(guest => (
                    <div key={guest.id} draggable onDragStart={() => setDraggedGuest(guest)} className="p-3 bg-white border rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:border-purple-400 dark:bg-surface-700 dark:border-surface-600">
                        <div className="flex justify-between items-start">
                            <span className="font-medium text-sm">{guest.full_name}</span>
                            <span className="text-xs bg-surface-100 px-1.5 rounded dark:bg-surface-600">{guest.amount_invited}</span>
                        </div>
                        {/* ✅ Mobile Action: Quick Move Dropdown */}
                        <div className="mt-2">
                            <select 
                                className="w-full p-1 text-xs border rounded bg-surface-50 dark:bg-surface-800 dark:border-surface-600"
                                onChange={(e) => handleSeatChange(guest.id, e.target.value)}
                                value=""
                            >
                                <option value="" disabled>Move to...</option>
                                {tables.map(t => (
                                    <option key={t.id} value={t.id}>{t.name} ({getGuestsForTable(t.id).reduce((s,g)=>s+(g.amount_invited||1),0)}/{t.capacity})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Main Area: Tables */}
        <div className="flex-1 overflow-y-auto print:overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20 print:grid-cols-2 print:gap-4 print:pb-0">
                {tables.map(table => {
                    const tableGuests = getGuestsForTable(table.id);
                    const totalSeated = tableGuests.reduce((sum, g) => sum + (g.amount_invited || 1), 0);
                    const isFull = totalSeated >= table.capacity;

                    return (
                        <div key={table.id} onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(table.id)} 
                             className={`flex flex-col bg-white border-2 rounded-2xl shadow-sm break-inside-avoid dark:bg-surface-800 ${isFull ? 'border-rose-200 dark:border-rose-900' : 'border-surface-200 dark:border-surface-700 hover:border-purple-300'}`}>
                            
                            <div className="p-4 border-b flex justify-between items-center bg-surface-50/50 dark:bg-surface-700/30 print:bg-gray-100">
                                <div>
                                    <h3 className="font-bold text-lg">{table.name}</h3>
                                    <div className={`text-xs font-mono font-bold ${isFull ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {totalSeated} / {table.capacity}
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteTable(table.id)} className="text-surface-400 hover:text-rose-500 print:hidden">🗑️</button>
                            </div>
                            
                            <div className="p-2 flex-1 min-h-[150px] space-y-1">
                                {tableGuests.map(guest => (
                                    <div key={guest.id} draggable onDragStart={() => setDraggedGuest(guest)} className="flex justify-between items-center p-2 text-sm bg-surface-50 rounded border border-transparent hover:border-purple-200 cursor-grab dark:bg-surface-700/50 print:border-gray-200">
                                        <div className="flex-1 truncate">
                                            {guest.full_name}
                                            {/* ✅ Mobile Action: Remove Button (X) */}
                                            <button onClick={() => handleSeatChange(guest.id, null)} className="mr-2 text-rose-400 hover:text-rose-600 print:hidden text-xs px-1">✕</button>
                                        </div>
                                        <span className="text-xs font-bold text-surface-400 bg-white px-1.5 rounded dark:bg-surface-600">{guest.amount_invited}</span>
                                    </div>
                                ))}
                                {tableGuests.length === 0 && <div className="text-center text-xs text-surface-300 italic py-4 print:hidden">Empty</div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SeatingArrangements;