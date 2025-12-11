import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config'; // <--- 1. ייבוא הכתובת

// --- אייקונים (SVG) ---
const Icons = {
  Search: () => <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  UserAdd: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  Back: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
};

const GuestList = () => {
  const { eventId } = useParams(); 
  
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // טופס הוספה
  const [newGuest, setNewGuest] = useState({ fullName: '', phone: '', side: 'friend', amountInvited: 1, mealOption: 'standard', dietaryNotes: '' });
  
  // טופס עריכה
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({}); 
  
  // פילטרים
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRsvp, setFilterRsvp] = useState('all');

  useEffect(() => { fetchGuests(); }, [eventId]);

  const fetchGuests = async () => {
    try {
      // 2. שימוש ב-API_URL
      const response = await axios.get(`${API_URL}/api/events/${eventId}/guests`);
      setGuests(response.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewGuest({ ...newGuest, [name]: value });
    if (name === 'fullName') {
       const exists = guests.some(g => g.full_name.toLowerCase() === value.toLowerCase());
       setDuplicateWarning(exists ? 'שים לב: שם זה כבר קיים במערכת' : '');
    }
  };

  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.fullName) return;
    try {
      // 3. שימוש ב-API_URL
      const response = await axios.post(`${API_URL}/api/guests`, { eventId: eventId, ...newGuest });
      setGuests([response.data, ...guests]);
      setNewGuest({ fullName: '', phone: '', side: 'friend', amountInvited: 1, mealOption: 'standard', dietaryNotes: '' });
      setDuplicateWarning('');
    } catch (err) { alert("שגיאה בהוספה"); }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm("למחוק את האורח לצמיתות?")) return;
    try {
      // 4. שימוש ב-API_URL
      await axios.delete(`${API_URL}/api/guests/${guestId}`);
      setGuests(guests.filter(g => g.id !== guestId));
    } catch (err) { alert("שגיאה במחיקה"); }
  };

  const handleStatusChange = async (guestId, newStatus) => {
    try {
      // 5. שימוש ב-API_URL
      const response = await axios.put(`${API_URL}/api/guests/${guestId}`, { rsvpStatus: newStatus });
      setGuests(guests.map(g => g.id === guestId ? response.data : g));
    } catch (err) { console.error("שגיאה בעדכון סטטוס"); }
  };

  const startEditing = (guest) => {
    setEditingId(guest.id);
    setEditFormData({ ...guest, rsvpStatus: guest.rsvp_status });
  };

  const saveEdit = async (guestId) => {
    try {
      // 6. שימוש ב-API_URL
      const response = await axios.put(`${API_URL}/api/guests/${guestId}`, { ...editFormData });
      setGuests(guests.map(g => g.id === guestId ? response.data : g));
      setEditingId(null);
    } catch (err) { alert("שגיאה בשמירה"); }
  };

  const filteredGuests = guests.filter(guest => {
    const matchesSearch = guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || (guest.phone && guest.phone.includes(searchTerm));
    const matchesFilter = filterRsvp === 'all' || guest.rsvp_status === filterRsvp;
    return matchesSearch && matchesFilter;
  });

  // --- Helpers לעיצוב ---
  const getSideBadge = (side) => {
    const styles = { 
      groom: 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20', 
      bride: 'bg-pink-50 text-pink-700 ring-1 ring-pink-600/20', 
      family: 'bg-purple-50 text-purple-700 ring-1 ring-purple-600/20', 
      friend: 'bg-gray-50 text-gray-600 ring-1 ring-gray-600/20' 
    };
    const labels = { groom: 'צד חתן', bride: 'צד כלה', family: 'משפחה', friend: 'חברים' };
    return <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold tracking-wide ${styles[side] || styles.friend}`}>{labels[side] || labels.friend}</span>;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'attending': return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 ring-1 ring-emerald-600/20';
      case 'declined': return 'bg-rose-100 text-rose-700 hover:bg-rose-200 ring-1 ring-rose-600/20';
      default: return 'bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-600/20';
    }
  };

  const getMealLabel = (meal) => ({ standard: 'רגיל', veggie: 'צמחוני', vegan: 'טבעוני', kids: 'ילדים' }[meal] || 'רגיל');

  if (loading) return <div className="p-12 text-center text-gray-500 font-medium animate-pulse">טוען את הרשימה...</div>;

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 font-sans text-slate-800" dir="rtl">
      
      <div className="max-w-[1400px] mx-auto mb-8">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-purple-600 transition font-medium text-sm bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 hover:shadow-md">
          <Icons.Back /> חזרה לדשבורד
        </Link>
      </div>

      <div className="max-w-[1400px] mx-auto bg-white shadow-xl shadow-slate-200/60 rounded-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
           <div>
             <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">ניהול מוזמנים</h2>
             <p className="text-slate-500 mt-2 text-sm">ניהול מרוכז של אישורי הגעה, סידורי הושבה ובקשות מיוחדות</p>
           </div>
           
           <div className="text-center bg-purple-50 px-8 py-4 rounded-2xl border border-purple-100 shadow-sm">
              <span className="block text-3xl font-bold text-purple-600">{guests.reduce((sum, g) => sum + (g.amount_invited || 1), 0)}</span>
              <span className="text-xs text-purple-400 font-bold uppercase tracking-wider">סה"כ אורחים</span>
           </div>
        </div>

        {/* Add Form Area */}
        <div className="bg-slate-50/80 p-8 border-b border-slate-200 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-6 text-purple-700 font-bold text-sm uppercase tracking-wide">
            <span className="bg-purple-100 p-1.5 rounded-lg"><Icons.UserAdd /></span> הוספת אורח חדש
          </div>
          <form onSubmit={handleAddGuest} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
            <div className="md:col-span-3">
              <input type="text" name="fullName" className="input-field" placeholder="שם מלא *" value={newGuest.fullName} onChange={handleInputChange} required />
              {duplicateWarning && <p className="text-xs text-rose-500 mt-1.5 font-medium flex items-center gap-1">⚠️ {duplicateWarning}</p>}
            </div>
            <div className="md:col-span-2">
              <select name="side" className="input-field bg-white cursor-pointer" value={newGuest.side} onChange={handleInputChange}>
                <option value="friend">חברים</option><option value="bride">צד כלה</option><option value="groom">צד חתן</option><option value="family">משפחה</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <input type="tel" name="phone" className="input-field" placeholder="טלפון" value={newGuest.phone} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-2">
              <select name="mealOption" className="input-field bg-white cursor-pointer" value={newGuest.mealOption} onChange={handleInputChange}>
                <option value="standard">מנה רגילה</option><option value="veggie">צמחוני</option><option value="vegan">טבעוני</option><option value="kids">ילדים</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <input type="text" name="dietaryNotes" className="input-field" placeholder="הערות תזונה" value={newGuest.dietaryNotes} onChange={handleInputChange} />
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-[48px] flex items-center justify-center transition shadow-lg shadow-purple-200 active:scale-95">
                <Icons.UserAdd />
              </button>
            </div>
          </form>
        </div>

        {/* List Content */}
        <div className="p-8 bg-white min-h-[600px]">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-5 mb-8 justify-between items-center">
            <div className="relative flex-1 max-w-md w-full group">
              <span className="absolute top-3.5 right-4 text-slate-400 group-focus-within:text-purple-500 transition-colors"><Icons.Search /></span>
              <input type="text" placeholder="חיפוש לפי שם או טלפון..." className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none transition shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="w-full md:w-60 relative">
              <select className="w-full py-3 px-4 border border-slate-200 rounded-xl text-sm bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none shadow-sm cursor-pointer appearance-none font-medium text-slate-600" value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)}>
                <option value="all">📌 הצג את כולם</option>
                <option value="attending">✅ מגיעים בלבד</option>
                <option value="pending">❓ טרם ענו</option>
                <option value="declined">❌ לא מגיעים</option>
              </select>
              <div className="absolute top-4 left-4 pointer-events-none text-[10px] text-slate-400">▼</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm ring-1 ring-slate-900/5">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="th-cell w-[25%] text-right">שם מלא</th>
                  <th className="th-cell w-[15%] text-right">טלפון</th>
                  <th className="th-cell w-[10%] text-right">קרבה</th>
                  <th className="th-cell w-[12%] text-center">סטטוס</th>
                  <th className="th-cell w-[10%] text-right">מנה</th>
                  <th className="th-cell w-[15%] text-right">הערות</th>
                  <th className="th-cell w-[5%] text-center">כמות</th>
                  <th className="th-cell w-[8%] text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredGuests.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-20 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <span>לא נמצאו אורחים התואמים את החיפוש.</span>
                  </td></tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className={`transition duration-150 group ${editingId === guest.id ? 'bg-purple-50/40 ring-1 ring-purple-100' : 'hover:bg-slate-50'}`}>
                      {editingId === guest.id ? (
                        /* ================== מצב עריכה ================== */
                        <>
                          <td className="p-3 align-middle"><input type="text" className="input-table font-bold" value={editFormData.fullName} onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} /></td>
                          <td className="p-3 align-middle"><input type="text" className="input-table font-mono text-xs" value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} /></td>
                          <td className="p-3 align-middle"><select className="input-table" value={editFormData.side} onChange={(e) => setEditFormData({...editFormData, side: e.target.value})}><option value="friend">חברים</option><option value="bride">כלה</option><option value="groom">חתן</option><option value="family">משפחה</option></select></td>
                          <td className="p-3 align-middle text-center">
                             <select className={`w-full py-1.5 px-1 text-xs font-bold rounded-lg cursor-pointer outline-none text-center shadow-sm border border-slate-200 ${getStatusClass(editFormData.rsvpStatus)}`} value={editFormData.rsvpStatus} onChange={(e) => setEditFormData({...editFormData, rsvpStatus: e.target.value})}>
                                <option value="pending">❓ טרם</option><option value="attending">✅ מגיע</option><option value="declined">❌ לא</option>
                             </select>
                          </td>
                          <td className="p-3 align-middle"><select className="input-table" value={editFormData.mealOption} onChange={(e) => setEditFormData({...editFormData, mealOption: e.target.value})}><option value="standard">רגיל</option><option value="veggie">צמחוני</option><option value="vegan">טבעוני</option><option value="kids">ילדים</option></select></td>
                          <td className="p-3 align-middle"><input type="text" className="input-table" value={editFormData.dietaryNotes} onChange={(e) => setEditFormData({...editFormData, dietaryNotes: e.target.value})} /></td>
                          <td className="p-3 align-middle"><input type="number" min="1" className="input-table text-center font-bold" value={editFormData.amountInvited} onChange={(e) => setEditFormData({...editFormData, amountInvited: e.target.value})} /></td>
                          <td className="p-3 align-middle text-left">
                            <div className="flex gap-2 justify-end">
                                <button onClick={() => saveEdit(guest.id)} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm transition" title="שמור"><Icons.Check /></button>
                                <button onClick={() => setEditingId(null)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition" title="בטל"><Icons.X /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* ================== מצב תצוגה ================== */
                        <>
                          <td className="td-cell font-semibold text-slate-800">{guest.full_name}</td>
                          <td className="td-cell text-slate-500 font-mono text-xs">{guest.phone || '-'}</td>
                          <td className="td-cell">{getSideBadge(guest.side)}</td>
                          
                          {/* סטטוס (כמוסה) */}
                          <td className="td-cell text-center">
                            <div className="relative inline-block w-full max-w-[100px]">
                              <select
                                value={guest.rsvp_status}
                                onChange={(e) => handleStatusChange(guest.id, e.target.value)}
                                className={`w-full text-[11px] font-bold rounded-full px-2 py-1.5 cursor-pointer outline-none appearance-none text-center shadow-sm transition-all active:scale-95 ${getStatusClass(guest.rsvp_status)}`}
                              >
                                <option value="pending">❓ טרם ענו</option>
                                <option value="attending">✅ מגיעים</option>
                                <option value="declined">❌ לא מגיעים</option>
                              </select>
                            </div>
                          </td>

                          <td className="td-cell text-xs text-slate-600 font-medium bg-slate-50/50 rounded px-2 py-1 inline-block mt-3 md:mt-0 md:bg-transparent">{getMealLabel(guest.meal_option)}</td>
                          <td className="td-cell text-xs text-slate-400 italic truncate max-w-[120px]" title={guest.dietary_notes}>{guest.dietary_notes}</td>
                          <td className="td-cell text-center"><span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">{guest.amount_invited}</span></td>
                          <td className="td-cell text-left">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                              <button onClick={() => startEditing(guest)} className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition"><Icons.Edit /></button>
                              <button onClick={() => handleDeleteGuest(guest.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition"><Icons.Trash /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <style>{`
        .input-field { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 0.75rem; font-size: 0.95rem; outline: none; transition: all 0.2s; background: white; }
        .input-field:focus { border-color: #a855f7; box-shadow: 0 0 0 4px rgba(168, 85, 247, 0.1); }
        
        .input-table { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 0.5rem; font-size: 0.85rem; outline: none; transition: all 0.2s; background: white; }
        .input-table:focus { border-color: #9333ea; box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.1); }
        
        .th-cell { padding: 16px 20px; font-size: 0.7rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .td-cell { padding: 16px 20px; white-space: nowrap; vertical-align: middle; border-bottom: 1px solid #f1f5f9; }
      `}</style>
    </div>
  );
};

export default GuestList;