import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const GuestList = () => {
  const { eventId } = useParams(); 
  
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // טופס להוספת אורח חדש
  const [newGuest, setNewGuest] = useState({ fullName: '', email: '', amountInvited: 1 });

  // --- State עבור עריכה ---
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ fullName: '', email: '', amountInvited: 1 });

  // --- תוספת: State עבור חיפוש ---
  const [searchTerm, setSearchTerm] = useState('');

  // 1. טעינת נתונים
  useEffect(() => {
    fetchGuests();
  }, [eventId]);

  const fetchGuests = async () => {
    try {
      const response = await axios.get(`http://localhost:4000/api/events/${eventId}/guests`);
      setGuests(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching guests:", err);
      setError('Failed to load guests.');
      setLoading(false);
    }
  };

  // 2. הוספת אורח (Add)
  const handleAddGuest = async (e) => {
    e.preventDefault();
    if (!newGuest.fullName) return;

    try {
      const response = await axios.post('http://localhost:4000/api/guests', {
        eventId: eventId,
        fullName: newGuest.fullName,
        email: newGuest.email,
        amountInvited: newGuest.amountInvited
      });
      setGuests([response.data, ...guests]);
      setNewGuest({ fullName: '', email: '', amountInvited: 1 });
    } catch (err) {
      alert("Error adding guest");
    }
  };

  // 3. מחיקת אורח (Delete)
  const handleDeleteGuest = async (guestId) => {
    if (!window.confirm("בטוח שברצונך למחוק את האורח?")) return;
    try {
      await axios.delete(`http://localhost:4000/api/guests/${guestId}`);
      setGuests(guests.filter(g => g.id !== guestId));
    } catch (err) {
      alert("Error deleting guest");
    }
  };

  // 4. עדכון סטטוס מהיר (RSVP)
  const handleStatusChange = async (guestId, newStatus) => {
    try {
      const response = await axios.put(`http://localhost:4000/api/guests/${guestId}`, {
        rsvpStatus: newStatus
      });
      setGuests(guests.map(g => g.id === guestId ? response.data : g));
    } catch (err) {
      console.error("Error updating status");
    }
  };

  // 5. --- פונקציות העריכה (Edit) ---
  const startEditing = (guest) => {
    setEditingId(guest.id);
    setEditFormData({ 
      fullName: guest.full_name, 
      email: guest.email || '', 
      amountInvited: guest.amount_invited 
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFormData({ fullName: '', email: '', amountInvited: 1 });
  };

  const saveEdit = async (guestId) => {
    try {
      const response = await axios.put(`http://localhost:4000/api/guests/${guestId}`, {
        fullName: editFormData.fullName,
        amountInvited: editFormData.amountInvited,
        // email: editFormData.email - (אם השרת תומך בעדכון מייל, זה ישלח גם אותו)
      });

      setGuests(guests.map(g => g.id === guestId ? response.data : g));
      setEditingId(null);
    } catch (err) {
      alert("Error saving changes");
    }
  };

  // --- תוספת: סינון האורחים לפי החיפוש ---
  const filteredGuests = guests.filter(guest => 
    guest.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center">טוען רשימת מוזמנים...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
      <h2 className="text-3xl font-bold mb-6 text-gray-800 border-b pb-4">ניהול רשימת מוזמנים</h2>

      {/* --- טופס הוספה --- */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8 border border-blue-100">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">הוספת אורח חדש</h3>
        <form onSubmit={handleAddGuest} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="ישראל ישראלי"
              value={newGuest.fullName}
              onChange={(e) => setNewGuest({ ...newGuest, fullName: e.target.value })}
              required
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל (אופציונלי)</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 outline-none"
              placeholder="example@mail.com"
              value={newGuest.email}
              onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
            />
          </div>
          <div className="w-full md:w-32">
            <label className="block text-sm font-medium text-gray-700 mb-1">כמות מוזמנים</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 outline-none"
              value={newGuest.amountInvited}
              onChange={(e) => setNewGuest({ ...newGuest, amountInvited: parseInt(e.target.value) })}
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition font-medium"
          >
            הוסף +
          </button>
        </form>
      </div>

      {/* --- תוספת: שדה חיפוש --- */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="🔍 חפש אורח לפי שם..."
          className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* --- טבלת אורחים --- */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">שם</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">פרטי קשר</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">סטטוס הגעה</th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">כמות</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">פעולות</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                  {searchTerm ? "לא נמצאו אורחים התואמים לחיפוש." : "הרשימה ריקה. זה הזמן להוסיף את האורח הראשון! 🎉"}
                </td>
              </tr>
            ) : (
              // שינוי: מיפוי על filteredGuests במקום guests
              filteredGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50 transition">
                  {/* --- תנאי: אם אנחנו במצב עריכה לשורה הזו --- */}
                  {editingId === guest.id ? (
                    <>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded"
                          value={editFormData.fullName}
                          onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="text" 
                          className="w-full p-1 border rounded"
                          value={editFormData.email} 
                          onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-sm">
                        (שנה בנפרד)
                      </td>
                      <td className="px-6 py-4">
                        <input 
                          type="number" 
                          min="1"
                          className="w-16 p-1 border rounded"
                          value={editFormData.amountInvited}
                          onChange={(e) => setEditFormData({...editFormData, amountInvited: e.target.value})}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button onClick={() => saveEdit(guest.id)} className="text-green-600 font-bold hover:text-green-900 ml-3">שמור</button>
                        <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">ביטול</button>
                      </td>
                    </>
                  ) : (
                    /* --- מצב תצוגה רגיל --- */
                    <>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{guest.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{guest.email || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={guest.rsvp_status}
                          onChange={(e) => handleStatusChange(guest.id, e.target.value)}
                          className={`text-xs font-bold rounded-full px-3 py-1 border-0 cursor-pointer outline-none
                            ${guest.rsvp_status === 'attending' ? 'bg-green-100 text-green-800' : 
                              guest.rsvp_status === 'declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}
                        >
                          <option value="pending">טרם ענו</option>
                          <option value="attending">מגיעים</option>
                          <option value="declined">לא מגיעים</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">{guest.amount_invited}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button 
                          onClick={() => startEditing(guest)}
                          className="text-indigo-600 hover:text-indigo-900 ml-4 transition"
                        >
                          ערוך
                        </button>
                        <button 
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-red-600 hover:text-red-900 transition"
                        >
                          מחק
                        </button>
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
  );
};

export default GuestList;