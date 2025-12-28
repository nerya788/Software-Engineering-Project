import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';

// --- אייקונים ---
const Icons = {
  Search: () => <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  UserAdd: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  Back: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Upload: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
};

const GuestList = () => {
  const { eventId } = useParams();
  const fileInputRef = useRef(null);
  
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
      const response = await axios.get(`${API_URL}/api/events/${eventId}/guests`);
      setGuests(response.data);
      setLoading(false);
    } catch (err) { setLoading(false); }
  };

  const handleExport = () => {
      window.open(`${API_URL}/api/events/${eventId}/guests/export`, '_blank');
  };

  const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('file', file);
      try {
          setLoading(true);
          await axios.post(`${API_URL}/api/events/${eventId}/guests/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          alert('הקובץ נטען בהצלחה!');
          fetchGuests();
      } catch (err) { alert('שגיאה בטעינת הקובץ'); setLoading(false); }
      e.target.value = '';
  };

  // --- עדכון כמות מוזמנים מהיר ---
  const updateAmount = async (guestId, newAmount) => {
      const amount = parseInt(newAmount, 10);
      if (!amount || amount < 1) return; // מניעת מספרים לא חוקיים
      
      try {
          // עדכון אופטימי (מקומי) כדי שהממשק ירגיש מהיר
          setGuests(prev => prev.map(g => g.id === guestId ? { ...g, amount_invited: amount } : g));
          
          // שליחה לשרת
          await axios.put(`${API_URL}/api/guests/${guestId}`, { amountInvited: amount });
      } catch (err) {
          console.error("שגיאה בעדכון כמות");
          fetchGuests(); // אם נכשל, נחזיר למצב האמיתי מהשרת
      }
  };
  // ------------------------------

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
      const response = await axios.post(`${API_URL}/api/guests`, { eventId: eventId, ...newGuest });
      setGuests([response.data, ...guests]);
      setNewGuest({ fullName: '', phone: '', side: 'friend', amountInvited: 1, mealOption: 'standard', dietaryNotes: '' });
      setDuplicateWarning('');
    } catch (err) { alert("שגיאה בהוספה"); }
  };

  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm("למחוק את האורח לצמיתות?")) return;
    try {
      await axios.delete(`${API_URL}/api/guests/${guestId}`);
      setGuests(guests.filter(g => g.id !== guestId));
    } catch (err) { alert("שגיאה במחיקה"); }
  };

  const handleStatusChange = async (guestId, newStatus) => {
    try {
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

  const getSideBadge = (side) => {
    const styles = { 
      groom: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-500/30', 
      bride: 'bg-pink-50 text-pink-700 ring-pink-600/20 dark:bg-pink-900/30 dark:text-pink-300 dark:ring-pink-500/30', 
      family: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/30 dark:text-purple-300 dark:ring-purple-500/30', 
      friend: 'bg-surface-50 text-surface-600 ring-surface-600/20 dark:bg-surface-700 dark:text-surface-300 dark:ring-surface-500/30' 
    };
    const labels = { groom: 'צד חתן', bride: 'צד כלה', family: 'משפחה', friend: 'חברים' };
    return <span className={`text-[11px] px-2.5 py-1 rounded-md font-semibold tracking-wide ring-1 ${styles[side] || styles.friend}`}>{labels[side] || labels.friend}</span>;
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'attending': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-500/30';
      case 'declined': return 'bg-rose-100 text-rose-700 ring-rose-600/20 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-500/30';
      default: return 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-500/30';
    }
  };

  const getMealLabel = (meal) => ({ standard: 'רגיל', veggie: 'צמחוני', vegan: 'טבעוני', kids: 'ילדים' }[meal] || 'רגיל');

  // סגנונות שהמרנו מ-CSS רגיל ל-Tailwind כדי לתמוך ב-Dark Mode
  const inputClass = "w-full p-3 border rounded-xl outline-none transition duration-200 text-sm bg-white border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400";
  const tableInputClass = "w-full p-2 border rounded-lg outline-none transition duration-200 text-xs bg-white border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-700 dark:border-surface-600 dark:text-white";
  const thClass = "px-4 py-3 text-xs font-bold tracking-wider text-right uppercase bg-surface-50 text-surface-500 dark:bg-surface-700/50 dark:text-surface-400 border-b border-surface-100 dark:border-surface-700";
  const tdClass = "px-4 py-3 text-sm whitespace-nowrap border-b border-surface-50 dark:border-surface-700 text-surface-700 dark:text-surface-200";

  if (loading) return <div className="p-12 font-medium text-center text-surface-500 animate-pulse dark:text-surface-400">טוען את הרשימה...</div>;

  return (
    <div className="min-h-screen p-8 font-sans transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-surface-100" dir="rtl">
      
      <div className="max-w-[1400px] mx-auto mb-8 flex justify-between items-center">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition bg-white border rounded-full shadow-sm text-surface-500 border-surface-200 hover:text-purple-600 hover:shadow-md dark:bg-surface-800 dark:border-surface-700 dark:text-surface-300 dark:hover:text-purple-400">
          <Icons.Back /> חזרה לדשבורד
        </Link>

        <div className="flex gap-3">
            <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition bg-white border rounded-lg shadow-sm text-surface-600 border-surface-200 hover:bg-surface-50 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-700">
                <Icons.Download /> ייצוא לאקסל
            </button>
            <button onClick={() => fileInputRef.current.click()} className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition bg-white border rounded-lg shadow-sm text-surface-600 border-surface-200 hover:bg-surface-50 dark:bg-surface-800 dark:border-surface-700 dark:text-surface-300 dark:hover:bg-surface-700">
                <Icons.Upload /> ייבוא מאקסל
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileSelect} />
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto bg-white dark:bg-surface-800 shadow-xl shadow-surface-200/60 dark:shadow-none rounded-2xl overflow-hidden border border-surface-200 dark:border-surface-700">
        
        <div className="flex flex-col items-center justify-between gap-4 p-8 bg-white border-b border-surface-100 dark:bg-surface-800 dark:border-surface-700 md:flex-row">
           <div>
             <h2 className="text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">ניהול מוזמנים</h2>
             <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">ניהול מרוכז של אישורי הגעה, סידורי הושבה ובקשות מיוחדות</p>
           </div>
           <div className="px-8 py-4 text-center border rounded-2xl bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:border-purple-800 shadow-sm">
              <span className="block text-3xl font-bold text-purple-600 dark:text-purple-400">{guests.reduce((sum, g) => sum + (g.amount_invited || 1), 0)}</span>
              <span className="text-xs font-bold tracking-wider text-purple-400 uppercase dark:text-purple-500">סה"כ אורחים</span>
           </div>
        </div>

        <div className="p-8 border-b backdrop-blur-sm bg-surface-50/80 border-surface-200 dark:bg-surface-700/30 dark:border-surface-700">
          <div className="flex items-center gap-2 mb-6 text-sm font-bold tracking-wide text-purple-700 uppercase dark:text-purple-300">
            <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/50"><Icons.UserAdd /></span> הוספת אורח חדש
          </div>
          <form onSubmit={handleAddGuest} className="grid items-center grid-cols-1 gap-3 md:grid-cols-12">
            
            {/* שם מלא */}
            <div className="relative md:col-span-2">
              <input type="text" name="fullName" className={inputClass} placeholder="שם מלא *" value={newGuest.fullName} onChange={handleInputChange} required />
              {duplicateWarning && <p className="absolute mt-1 text-xs font-medium text-rose-500">⚠️ {duplicateWarning}</p>}
            </div>
            
            {/* טלפון */}
            <div className="md:col-span-2">
              <input type="tel" name="phone" className={inputClass} placeholder="טלפון" value={newGuest.phone} onChange={handleInputChange} />
            </div>
            
            {/* כמות */}
            <div className="md:col-span-1">
               <input 
                 type="number" 
                 min="1" 
                 name="amountInvited" 
                 className={`${inputClass} text-center`} 
                 placeholder="#" 
                 value={newGuest.amountInvited} 
                 onChange={handleInputChange} 
               />
            </div>

            {/* צד */}
            <div className="md:col-span-2">
              <select name="side" className={`${inputClass} cursor-pointer`} value={newGuest.side} onChange={handleInputChange}>
                <option value="friend">חברים</option><option value="bride">צד כלה</option><option value="groom">צד חתן</option><option value="family">משפחה</option>
              </select>
            </div>
            
            {/* מנה */}
            <div className="md:col-span-2">
              <select name="mealOption" className={`${inputClass} cursor-pointer`} value={newGuest.mealOption} onChange={handleInputChange}>
                <option value="standard">מנה רגילה</option><option value="veggie">צמחוני</option><option value="vegan">טבעוני</option><option value="kids">ילדים</option>
              </select>
            </div>
            
            {/* הערות */}
            <div className="md:col-span-2">
              <input type="text" name="dietaryNotes" className={inputClass} placeholder="הערות" value={newGuest.dietaryNotes} onChange={handleInputChange} />
            </div>
            
            {/* כפתור */}
            <div className="md:col-span-1">
              <button type="submit" className="flex items-center justify-center w-full bg-purple-600 rounded-xl h-[46px] text-white hover:bg-purple-700 transition shadow-md active:scale-95 dark:shadow-none" title="הוסף לרשימה">
                <Icons.UserAdd />
              </button>
            </div>
          </form>
        </div>

        <div className="p-8 bg-white dark:bg-surface-800 min-h-[600px]">
          <div className="flex flex-col items-center justify-between gap-5 mb-8 md:flex-row">
            <div className="relative w-full max-w-md flex-1 group">
              <span className="absolute top-3.5 right-4 text-surface-400 group-focus-within:text-purple-500 transition-colors"><Icons.Search /></span>
              <input type="text" placeholder="חיפוש לפי שם או טלפון..." className="w-full py-3 pl-4 text-sm transition border outline-none pr-12 rounded-xl border-surface-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-sm bg-white dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative w-full md:w-60">
              <select className="w-full py-3 px-4 text-sm font-medium transition border outline-none appearance-none cursor-pointer rounded-xl border-surface-200 bg-white focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 shadow-sm text-surface-600 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200" value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)}>
                <option value="all">📌 הצג את כולם</option>
                <option value="attending">✅ מגיעים בלבד</option>
                <option value="pending">❓ טרם ענו</option>
                <option value="declined">❌ לא מגיעים</option>
              </select>
              <div className="absolute top-4 left-4 pointer-events-none text-[10px] text-surface-400">▼</div>
            </div>
          </div>

          <div className="overflow-hidden border rounded-xl shadow-sm border-surface-200 dark:border-surface-700 ring-1 ring-surface-900/5">
            <table className="min-w-full divide-y divide-surface-100 dark:divide-surface-700">
              <thead>
                <tr>
                  <th className={`${thClass} w-[25%]`}>שם מלא</th>
                  <th className={`${thClass} w-[15%]`}>טלפון</th>
                  <th className={`${thClass} w-[10%]`}>קרבה</th>
                  <th className={`${thClass} w-[12%] text-center`}>סטטוס</th>
                  <th className={`${thClass} w-[10%]`}>מנה</th>
                  <th className={`${thClass} w-[15%]`}>הערות</th>
                  <th className={`${thClass} w-[5%] text-center`}>כמות</th>
                  <th className={`${thClass} w-[8%] text-left`}>פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-surface-100 dark:bg-surface-800 dark:divide-surface-700">
                {filteredGuests.length === 0 ? (
                  <tr><td colSpan="8" className="px-6 py-20 text-sm text-center flex flex-col items-center justify-center gap-2 text-surface-400">
                    <span className="text-2xl">🔍</span>
                    <span>לא נמצאו אורחים התואמים את החיפוש.</span>
                  </td></tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className={`transition duration-150 group ${editingId === guest.id ? 'bg-purple-50/40 dark:bg-purple-900/10 ring-1 ring-purple-100 dark:ring-purple-800' : 'hover:bg-surface-50 dark:hover:bg-surface-700/50'}`}>
                      {editingId === guest.id ? (
                        /* עריכה מלאה */
                        <>
                          <td className="p-3 align-middle"><input type="text" className={`${tableInputClass} font-bold`} value={editFormData.fullName} onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})} /></td>
                          <td className="p-3 align-middle"><input type="text" className={`${tableInputClass} font-mono`} value={editFormData.phone} onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})} /></td>
                          <td className="p-3 align-middle"><select className={tableInputClass} value={editFormData.side} onChange={(e) => setEditFormData({...editFormData, side: e.target.value})}><option value="friend">חברים</option><option value="bride">כלה</option><option value="groom">חתן</option><option value="family">משפחה</option></select></td>
                          <td className="p-3 text-center align-middle"><select className={`w-full py-1.5 px-1 text-xs font-bold rounded-lg cursor-pointer outline-none text-center shadow-sm border border-surface-200 dark:border-surface-600 ring-1 ${getStatusClass(editFormData.rsvpStatus)}`} value={editFormData.rsvpStatus} onChange={(e) => setEditFormData({...editFormData, rsvpStatus: e.target.value})}><option value="pending">❓ טרם</option><option value="attending">✅ מגיע</option><option value="declined">❌ לא</option></select></td>
                          <td className="p-3 align-middle"><select className={tableInputClass} value={editFormData.mealOption} onChange={(e) => setEditFormData({...editFormData, mealOption: e.target.value})}><option value="standard">רגיל</option><option value="veggie">צמחוני</option><option value="vegan">טבעוני</option><option value="kids">ילדים</option></select></td>
                          <td className="p-3 align-middle"><input type="text" className={tableInputClass} value={editFormData.dietaryNotes} onChange={(e) => setEditFormData({...editFormData, dietaryNotes: e.target.value})} /></td>
                          <td className="p-3 align-middle"><input type="number" min="1" className={`${tableInputClass} text-center font-bold`} value={editFormData.amountInvited} onChange={(e) => setEditFormData({...editFormData, amountInvited: e.target.value})} /></td>
                          <td className="p-3 text-left align-middle">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => saveEdit(guest.id)} className="p-2 text-white transition rounded-lg shadow-sm bg-emerald-500 hover:bg-emerald-600" title="שמור"><Icons.Check /></button>
                                <button onClick={() => setEditingId(null)} className="p-2 transition bg-white border rounded-lg border-surface-200 text-surface-400 hover:text-rose-500 hover:border-rose-200 dark:bg-surface-700 dark:border-surface-600 dark:hover:border-rose-500" title="בטל"><Icons.X /></button>
                            </div>
                          </td>
                        </>
                      ) : (
                        /* תצוגה */
                        <>
                          <td className={`${tdClass} font-semibold text-surface-800 dark:text-surface-100`}>{guest.full_name}</td>
                          <td className={`${tdClass} text-surface-500 dark:text-surface-400 font-mono text-xs`}>{guest.phone || '-'}</td>
                          <td className={tdClass}>{getSideBadge(guest.side)}</td>
                          <td className={`${tdClass} text-center`}>
                            <div className="relative inline-block w-full max-w-[100px]">
                              <select
                                value={guest.rsvp_status}
                                onChange={(e) => handleStatusChange(guest.id, e.target.value)}
                                className={`w-full text-[11px] font-bold rounded-full px-2 py-1.5 cursor-pointer outline-none appearance-none text-center shadow-sm transition-all ring-1 active:scale-95 ${getStatusClass(guest.rsvp_status)}`}
                              >
                                <option value="pending">❓ טרם ענו</option>
                                <option value="attending">✅ מגיעים</option>
                                <option value="declined">❌ לא מגיעים</option>
                              </select>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <span className="inline-block px-2 py-1 mt-3 text-xs font-medium rounded text-surface-600 bg-surface-50/50 dark:bg-surface-700 dark:text-surface-300 md:mt-0 md:bg-transparent">{getMealLabel(guest.meal_option)}</span>
                          </td>
                          <td className={`${tdClass} text-xs text-surface-400 italic truncate max-w-[120px]`} title={guest.dietary_notes}>{guest.dietary_notes}</td>
                          
                          {/* תא כמות עם עריכה מהירה */}
                          <td className={`${tdClass} text-center`}>
                              <input 
                                type="number" 
                                min="1"
                                defaultValue={guest.amount_invited}
                                onBlur={(e) => {
                                    if(Number(e.target.value) !== guest.amount_invited) {
                                        updateAmount(guest.id, e.target.value);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') e.target.blur();
                                }}
                                className="w-12 py-1 text-xs font-bold text-center transition border border-transparent rounded outline-none bg-surface-100 focus:bg-white focus:border-purple-500 dark:bg-surface-700 dark:focus:bg-surface-600 dark:text-surface-100"
                              />
                          </td>

                          <td className={`${tdClass} text-left`}>
                            <div className="flex items-center justify-end gap-2 transition-all duration-200 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0">
                              <button onClick={() => startEditing(guest)} className="p-2 transition border border-transparent rounded-lg text-surface-400 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-100 dark:hover:bg-blue-900/30 dark:hover:text-blue-300"><Icons.Edit /></button>
                              <button onClick={() => handleDeleteGuest(guest.id)} className="p-2 transition border border-transparent rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 dark:hover:bg-rose-900/30 dark:hover:text-rose-300"><Icons.Trash /></button>
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
    </div>
  );
};

export default GuestList;