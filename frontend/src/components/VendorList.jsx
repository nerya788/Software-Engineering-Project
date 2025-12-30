import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { Star, Phone, Mail, Plus, Trash2, X, AlertCircle } from 'lucide-react';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState('');
  
  // State לטופס הוספה
  const [newVendor, setNewVendor] = useState({ 
    name: '', 
    category: '', 
    phone: '', 
    email: '', 
    priceEstimate: '', 
    notes: '' 
  });

  const categories = [
    { id: 'Catering', label: 'קייטרינג ומזון', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300' },
    { id: 'Music', label: 'מוזיקה ו-DJ', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-300' },
    { id: 'Photography', label: 'צילום', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300' },
    { id: 'Venue', label: 'אולם / גן אירועים', color: 'text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-300' },
    { id: 'Attire', label: 'ביגוד והנעלה', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300' },
    { id: 'Other', label: 'שונות', color: 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-300' },
  ];

  // --- תיקון: פונקציה לקבלת ה-ID של המשתמש המחובר ---
  const getUserId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.id || user._id; 
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    const userId = getUserId();
    if (!userId) return; 

    try {
      setLoading(true);
      // שינוי: שליחת userId ב-URL (Query Param) במקום Header
      const res = await axios.get(`${API_URL}/api/vendors?userId=${userId}`);
      setVendors(res.data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError('לא הצלחנו לטעון את הרשימה. נסה לרענן.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setError('');
    
    const userId = getUserId();
    if (!userId) {
        setError('נא להתחבר מחדש למערכת.');
        return;
    }

    if (!newVendor.name || !newVendor.category) {
      setError('נא למלא שם וקטגוריה.');
      return;
    }

    try {
      // שינוי: הוספת userId לגוף הבקשה
      await axios.post(`${API_URL}/api/vendors`, { ...newVendor, userId });
      
      // רענון ואיפוס
      await fetchVendors();
      setIsFormOpen(false);
      setNewVendor({ name: '', category: '', phone: '', email: '', priceEstimate: '', notes: '' });
    } catch (err) {
      console.error("Error adding vendor:", err);
      setError('שגיאה בשמירה. נסה שוב.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('למחוק את הספק הזה לצמיתות?')) return;
    try {
      // עדכון אופטימי
      setVendors(vendors.filter(v => v._id !== id));
      
      await axios.delete(`${API_URL}/api/vendors/${id}`);
    } catch (err) {
      console.error("Error deleting vendor:", err);
      fetchVendors();
    }
  };

  const handleRate = async (vendorId, rating) => {
    // עדכון אופטימי
    setVendors(vendors.map(v => v._id === vendorId ? { ...v, rating } : v));

    try {
      await axios.put(`${API_URL}/api/vendors/${vendorId}`, { rating });
    } catch (err) {
      console.error("Error rating vendor:", err);
    }
  };

  const getCategoryDetails = (catId) => {
    return categories.find(c => c.id === catId) || categories.find(c => c.id === 'Other');
  };

  return (
    <div className="min-h-screen pb-20 font-sans bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50 transition-colors duration-300" dir="rtl">
      
      {/* כותרת עליונה */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-surface-800/80 backdrop-blur-md border-b border-surface-100 dark:border-surface-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text">
              ניהול ספקים
            </h1>
          </div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full font-medium shadow-lg transition-all transform hover:scale-105 ${
              isFormOpen 
                ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 dark:shadow-none'
            }`}
          >
            {isFormOpen ? <X size={20} /> : <Plus size={20} />}
            <span className="hidden sm:inline">{isFormOpen ? 'סגור טופס' : 'ספק חדש'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* הודעת שגיאה */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/50 rounded-xl flex items-center gap-2 animate-fade-in">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {/* טופס הוספה */}
        {isFormOpen && (
          <div className="mb-8 p-6 bg-white dark:bg-surface-800 rounded-3xl shadow-lg border border-surface-100 dark:border-surface-700 animate-fade-in-down">
            <h3 className="text-lg font-bold mb-4 text-surface-800 dark:text-surface-100">הוספת ספק חדש</h3>
            <form onSubmit={handleAddVendor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <input 
                placeholder="שם העסק / הספק *" 
                required
                className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                value={newVendor.name}
                onChange={e => setNewVendor({...newVendor, name: e.target.value})}
              />
              
              <select 
                required
                className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                value={newVendor.category}
                onChange={e => setNewVendor({...newVendor, category: e.target.value})}
              >
                <option value="">בחר קטגוריה *</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>

              <div className="relative">
                <Phone className="absolute top-3.5 right-3 text-surface-400" size={18} />
                <input 
                  placeholder="טלפון (אופציונלי)" 
                  className="w-full p-3 pr-10 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  value={newVendor.phone}
                  onChange={e => setNewVendor({...newVendor, phone: e.target.value})}
                />
              </div>

              <div className="relative">
                <Mail className="absolute top-3.5 right-3 text-surface-400" size={18} />
                <input 
                  type="email"
                  placeholder="אימייל (אופציונלי)" 
                  className="w-full p-3 pr-10 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  value={newVendor.email}
                  onChange={e => setNewVendor({...newVendor, email: e.target.value})}
                />
              </div>

              <input 
                type="number"
                placeholder="הצעת מחיר (משוערת ₪)" 
                className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={newVendor.priceEstimate}
                onChange={e => setNewVendor({...newVendor, priceEstimate: e.target.value})}
              />

              <input 
                placeholder="הערות נוספות..." 
                className="p-3 rounded-xl bg-surface-50 dark:bg-surface-700 border-surface-200 dark:border-surface-600 outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                value={newVendor.notes}
                onChange={e => setNewVendor({...newVendor, notes: e.target.value})}
              />

              <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                <button 
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-surface-600 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-700 font-medium"
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition-transform active:scale-95"
                >
                  שמור ספק
                </button>
              </div>
            </form>
          </div>
        )}

        {/* רשימת הכרטיסיות */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-surface-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
            <p>טוען את הספקים שלך...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-surface-800 rounded-3xl border border-dashed border-surface-300 dark:border-surface-600">
            <div className="text-4xl mb-4 opacity-50">📂</div>
            <h3 className="text-xl font-bold text-surface-600 dark:text-surface-300">עדיין אין ספקים ברשימה</h3>
            <p className="text-surface-400 mt-1">לחץ על "ספק חדש" למעלה כדי להתחיל.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => {
              const style = getCategoryDetails(vendor.category);
              return (
                <div key={vendor._id} className="group bg-white dark:bg-surface-800 p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-surface-100 dark:border-surface-700 relative">
                  
                  <button 
                    onClick={() => handleDelete(vendor._id)}
                    className="absolute top-4 left-4 p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition opacity-100 md:opacity-0 group-hover:opacity-100 z-10"
                    title="מחק ספק"
                  >
                    <Trash2 size={18} />
                  </button>

                  <div className="flex flex-col items-start mb-4">
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full mb-2 ${style.color}`}>
                      {style.label}
                    </span>
                    <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 leading-tight">
                      {vendor.name}
                    </h3>
                  </div>

                  <div className="space-y-3 mb-6 min-h-[80px]">
                    {vendor.phone ? (
                      <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                        <div className="p-1.5 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-500">
                          <Phone size={14} />
                        </div>
                        <a href={`tel:${vendor.phone}`} className="hover:text-blue-500 transition" dir="ltr">{vendor.phone}</a>
                      </div>
                    ) : (
                      <div className="text-sm text-surface-300 italic flex items-center gap-3 opacity-50">
                        <div className="p-1.5 bg-surface-50 dark:bg-surface-800 rounded-full"><Phone size={14} /></div>
                         אין טלפון
                      </div>
                    )}

                    {vendor.email && (
                      <div className="flex items-center gap-3 text-sm text-surface-600 dark:text-surface-300">
                        <div className="p-1.5 bg-surface-100 dark:bg-surface-700 rounded-full text-surface-500">
                          <Mail size={14} />
                        </div>
                        <span className="truncate max-w-[200px]">{vendor.email}</span>
                      </div>
                    )}

                    {vendor.priceEstimate > 0 && (
                      <div className="flex items-center gap-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 pt-1">
                        <span className="text-lg">💰</span>
                        <span>₪{Number(vendor.priceEstimate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-surface-100 dark:border-surface-700 flex justify-between items-end">
                    <div className="flex-1 pr-2">
                      {vendor.notes ? (
                        <p className="text-xs text-surface-500 dark:text-surface-400 italic line-clamp-2" title={vendor.notes}>
                          "{vendor.notes}"
                        </p>
                      ) : (
                        <span className="text-xs text-surface-300 select-none">...</span>
                      )}
                    </div>
                    
                    <div className="flex gap-0.5 shrink-0" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => handleRate(vendor._id, star)}
                          className={`transition-all hover:scale-125 p-0.5 ${star <= (vendor.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-surface-200 dark:text-surface-600'}`}
                        >
                          <Star size={18} fill={star <= (vendor.rating || 0) ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorList;