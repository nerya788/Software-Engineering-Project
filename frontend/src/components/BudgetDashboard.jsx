import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { 
  Trash2, CheckCircle, Circle, Plus, ArrowRight, 
  Wallet, TrendingUp, AlertCircle, X, Edit2, 
  Filter, Download, Search
} from 'lucide-react';
import { API_URL } from '../config';

const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#ef4444', '#94a3b8'];

export default function BudgetDashboard() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [summary, setSummary] = useState({ totalExpenses: 0, totalPaid: 0, remaining: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(0);
  const [filterCategory, setFilterCategory] = useState('הכל');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [newItem, setNewItem] = useState({ title: '', vendor: '', amount: '', category: 'כללי', notes: '' });

  useEffect(() => {
    fetchBudget();
  }, [eventId]);

  // סינון אוטומטי כשהנתונים או הפילטרים משתנים
  useEffect(() => {
    let result = items;
    if (filterCategory !== 'הכל') {
      result = result.filter(item => item.category === filterCategory);
    }
    if (searchTerm) {
      result = result.filter(item => item.title.includes(searchTerm) || item.vendor.includes(searchTerm));
    }
    setFilteredItems(result);
  }, [items, filterCategory, searchTerm]);

  const fetchBudget = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events/${eventId}/budget`);
      setItems(res.data.items);
      setFilteredItems(res.data.items);
      setBudgetLimit(res.data.budgetLimit);
      setTempLimit(res.data.budgetLimit);
      setSummary(res.data.summary);
      setChartData(res.data.chartData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load budget", err);
      setLoading(false);
    }
  };

  const updateBudgetLimit = async () => {
    try {
        await axios.put(`${API_URL}/api/events/${eventId}/budget-limit`, { totalBudget: tempLimit });
        setBudgetLimit(tempLimit);
        setIsEditingLimit(false);
        fetchBudget(); 
    } catch (err) {
        alert('שגיאה בעדכון התקציב');
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.title || !newItem.amount) return alert("נא למלא שם וסכום");

    try {
      await axios.post(`${API_URL}/api/budget`, { 
          eventId, 
          title: newItem.title, 
          amount: Number(newItem.amount), 
          category: newItem.category,
          vendor: newItem.vendor,
          notes: newItem.notes
      });
      setIsModalOpen(false);
      setNewItem({ title: '', vendor: '', amount: '', category: 'כללי', notes: '' });
      fetchBudget();
    } catch (err) {
      console.error(err);
      alert('שגיאה בהוספת הוצאה');
    }
  };

  const togglePaid = async (item) => {
    try {
      await axios.put(`${API_URL}/api/budget/${item.id}`, { is_paid: !item.is_paid });
      fetchBudget();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('למחוק הוצאה זו?')) return;
    try {
      await axios.delete(`${API_URL}/api/budget/${id}`);
      fetchBudget();
    } catch (err) {
      console.error(err);
    }
  };

  // פונקציית ייצוא לאקסל (CSV)
  const exportToCSV = () => {
    const headers = ["שם ההוצאה", "ספק", "קטגוריה", "סכום", "סטטוס", "הערות"];
    const rows = items.map(item => [
      item.title,
      item.vendor || '-',
      item.category,
      item.amount,
      item.is_paid ? "שולם" : "לא שולם",
      item.notes || '-'
    ]);

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "budget_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  const usagePercent = budgetLimit > 0 ? (summary.totalExpenses / budgetLimit) * 100 : 0;
  const isOverBudget = summary.totalExpenses > budgetLimit && budgetLimit > 0;

  if (loading) return <div className="flex justify-center items-center h-screen text-purple-600">טוען נתונים...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20 font-sans text-gray-800" dir="rtl">
      
      {/* --- Header --- */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500">
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        ניהול תקציב
                    </h1>
                    <p className="text-xs text-gray-400 hidden md:block">נהל את ההוצאות שלך בחכמה</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={exportToCSV}
                    className="bg-white border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl hover:bg-gray-50 flex items-center gap-2 transition text-sm font-medium"
                >
                    <Download size={18} /> <span className="hidden md:inline">ייצוא</span>
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-purple-200 flex items-center gap-2 transition transform hover:scale-105 font-medium text-sm"
                >
                    <Plus size={20} /> הוצאה חדשה
                </button>
            </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* --- Top Cards --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-500 text-sm font-medium">יעד תקציב</p>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></div>
                </div>
                {isEditingLimit ? (
                    <div className="flex items-center gap-2 mt-1">
                        <input 
                            type="number" 
                            className="w-full p-1 border-b-2 border-blue-500 outline-none text-xl font-bold"
                            value={tempLimit}
                            onChange={(e) => setTempLimit(e.target.value)}
                            autoFocus
                        />
                        <button onClick={updateBudgetLimit} className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md">שמור</button>
                    </div>
                ) : (
                    <div className="flex items-end gap-2 cursor-pointer group" onClick={() => setIsEditingLimit(true)}>
                        <h2 className="text-3xl font-bold text-gray-800">₪{Number(budgetLimit).toLocaleString()}</h2>
                        <Edit2 size={14} className="text-gray-300 group-hover:text-blue-500 mb-2 transition" />
                    </div>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-500 text-sm font-medium">נוצל בפועל</p>
                    <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-red-50 text-red-600' : 'bg-purple-50 text-purple-600'}`}><TrendingUp size={20} /></div>
                </div>
                <h2 className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-gray-800'}`}>
                    ₪{summary.totalExpenses.toLocaleString()}
                </h2>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mt-4 overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                    <p className="text-gray-500 text-sm font-medium">יתרה לשימוש</p>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><AlertCircle size={20} /></div>
                </div>
                <h2 className={`text-3xl font-bold ${summary.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                    ₪{summary.remaining.toLocaleString()}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                    {summary.remaining < 0 ? 'חריגה מהתקציב!' : 'נותר לשימוש חופשי'}
                </p>
            </div>
        </div>

        {/* --- Charts Section (New & Improved) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">התפלגות הוצאות (עוגה)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(value) => `₪${value.toLocaleString()}`} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[350px]">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">הוצאות לפי קטגוריה (עמודות)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" interval={0} height={50} />
                        <YAxis fontSize={12} width={40} />
                        <Tooltip 
                            formatter={(value) => `₪${value.toLocaleString()}`}
                            cursor={{ fill: '#f9fafb' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- List Section with Filters --- */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Filters Bar */}
            <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Filter size={16} className="text-gray-400" />
                    <select 
                        className="bg-white border border-gray-200 text-sm rounded-lg p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                    >
                        <option value="הכל">כל הקטגוריות</option>
                        {['אולם וקייטרינג', 'צילום', 'מוזיקה', 'ביגוד וטיפוח', 'עיצוב', 'מתנות', 'טקסים', 'כללי', 'אחר'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
                <div className="relative w-full md:w-64">
                    <Search size={16} className="absolute right-3 top-3 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="חיפוש הוצאה או ספק..." 
                        className="w-full pr-10 pl-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 uppercase">
                        <tr>
                            <th className="py-3 px-6 text-right">סטטוס</th>
                            <th className="py-3 px-6 text-right">הוצאה</th>
                            <th className="py-3 px-6 text-right">ספק</th>
                            <th className="py-3 px-6 text-right">קטגוריה</th>
                            <th className="py-3 px-6 text-right">סכום</th>
                            <th className="py-3 px-6 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-8 text-gray-400">לא נמצאו הוצאות</td>
                            </tr>
                        ) : filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-purple-50/20 transition">
                                <td className="py-3 px-6">
                                    <button 
                                        onClick={() => togglePaid(item)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition w-fit ${
                                            item.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {item.is_paid ? <CheckCircle size={12} /> : <Circle size={12} />}
                                        {item.is_paid ? 'שולם' : 'לא שולם'}
                                    </button>
                                </td>
                                <td className="py-3 px-6 font-medium text-gray-800">{item.title}</td>
                                <td className="py-3 px-6 text-gray-500">{item.vendor || '-'}</td>
                                <td className="py-3 px-6"><span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{item.category}</span></td>
                                <td className="py-3 px-6 font-bold text-gray-700">₪{item.amount.toLocaleString()}</td>
                                <td className="py-3 px-6 text-center">
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition p-1">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* --- Add Item Modal --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                  <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-800">הוספת הוצאה חדשה</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full"><X size={20} className="text-gray-500" /></button>
                  </div>
                  
                  <form onSubmit={handleAddItem} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">שם ההוצאה *</label>
                              <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="למשל: צלם מגנטים" />
                          </div>
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">ספק (אופציונלי)</label>
                              <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  value={newItem.vendor} onChange={e => setNewItem({...newItem, vendor: e.target.value})} placeholder="שם העסק" />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">סכום (₪) *</label>
                              <input required type="number" min="0" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">קטגוריה</label>
                              <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                  value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                  {['אולם וקייטרינג', 'צילום', 'מוזיקה', 'ביגוד וטיפוח', 'עיצוב', 'מתנות', 'טקסים', 'כללי', 'אחר'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-medium text-gray-500 mb-1 block">הערות</label>
                          <textarea className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm" rows="2"
                              value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder="פרטים נוספים..." />
                      </div>

                      <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-xl transition mt-2">
                          שמור הוצאה
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}