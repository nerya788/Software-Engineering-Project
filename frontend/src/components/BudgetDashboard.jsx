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

  if (loading) return <div className="flex items-center justify-center h-screen text-purple-600 dark:text-purple-400">טוען נתונים...</div>;

  return (
    <div className="min-h-screen pb-20 font-sans transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50" dir="rtl">
      
      {/* --- Header --- */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm dark:bg-surface-800 border-surface-100 dark:border-surface-700">
          <div className="flex items-center justify-between px-4 py-4 mx-auto max-w-7xl md:px-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/')} className="p-2 transition rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400">
                    <ArrowRight size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
                        ניהול תקציב
                    </h1>
                    <p className="hidden text-xs text-surface-400 md:block">נהל את ההוצאות שלך בחכמה</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition bg-white border rounded-xl border-surface-200 text-surface-600 hover:bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-600"
                >
                    <Download size={18} /> <span className="hidden md:inline">ייצוא</span>
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white transition transform bg-purple-600 rounded-xl shadow-lg hover:bg-purple-700 hover:scale-105 shadow-purple-200 dark:shadow-none"
                >
                    <Plus size={20} /> הוצאה חדשה
                </button>
            </div>
          </div>
      </div>

      <div className="px-4 py-8 mx-auto max-w-7xl md:px-6">

        {/* --- Top Cards --- */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <div className="relative overflow-hidden bg-white border shadow-sm dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700">
                <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">יעד תקציב</p>
                    <div className="p-2 text-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"><Wallet size={20} /></div>
                </div>
                {isEditingLimit ? (
                    <div className="flex items-center gap-2 mt-1">
                        <input 
                            type="number" 
                            className="w-full p-1 text-xl font-bold bg-transparent border-b-2 border-blue-500 outline-none dark:text-white"
                            value={tempLimit}
                            onChange={(e) => setTempLimit(e.target.value)}
                            autoFocus
                        />
                        <button onClick={updateBudgetLimit} className="px-3 py-1 text-xs text-white bg-blue-500 rounded-md">שמור</button>
                    </div>
                ) : (
                    <div className="flex items-end gap-2 transition cursor-pointer group" onClick={() => setIsEditingLimit(true)}>
                        <h2 className="text-3xl font-bold text-surface-800 dark:text-white">₪{Number(budgetLimit).toLocaleString()}</h2>
                        <Edit2 size={14} className="mb-2 transition text-surface-300 group-hover:text-blue-500 dark:text-surface-600" />
                    </div>
                )}
            </div>

            <div className="relative overflow-hidden bg-white border shadow-sm dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700">
                <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">נוצל בפועל</p>
                    <div className={`p-2 rounded-lg ${isOverBudget ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'}`}><TrendingUp size={20} /></div>
                </div>
                <h2 className={`text-3xl font-bold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-surface-800 dark:text-white'}`}>
                    ₪{summary.totalExpenses.toLocaleString()}
                </h2>
                <div className="w-full mt-4 overflow-hidden rounded-full bg-surface-100 dark:bg-surface-700 h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-purple-500'}`} style={{ width: `${Math.min(usagePercent, 100)}%` }}></div>
                </div>
            </div>

            <div className="relative overflow-hidden bg-white border shadow-sm dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700">
                <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-medium text-surface-500 dark:text-surface-400">יתרה לשימוש</p>
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"><AlertCircle size={20} /></div>
                </div>
                <h2 className={`text-3xl font-bold ${summary.remaining < 0 ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₪{summary.remaining.toLocaleString()}
                </h2>
                <p className="mt-2 text-xs text-surface-400">
                    {summary.remaining < 0 ? 'חריגה מהתקציב!' : 'נותר לשימוש חופשי'}
                </p>
            </div>
        </div>

        {/* --- Charts Section --- */}
        <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-100 dark:bg-surface-800 dark:border-surface-700 h-[350px]">
                <h3 className="mb-4 text-sm font-bold text-surface-700 dark:text-surface-200">התפלגות הוצאות (עוגה)</h3>
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-surface-100 dark:bg-surface-800 dark:border-surface-700 h-[350px]">
                <h3 className="mb-4 text-sm font-bold text-surface-700 dark:text-surface-200">הוצאות לפי קטגוריה (עמודות)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                        <XAxis dataKey="name" fontSize={10} angle={-15} textAnchor="end" interval={0} height={50} stroke="#94a3b8" />
                        <YAxis fontSize={12} width={40} stroke="#94a3b8" />
                        <Tooltip 
                            formatter={(value) => `₪${value.toLocaleString()}`}
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* --- List Section with Filters --- */}
        <div className="overflow-hidden bg-white border shadow-sm dark:bg-surface-800 rounded-2xl border-surface-100 dark:border-surface-700">
            
            {/* Filters Bar */}
            <div className="flex flex-col items-center justify-between gap-4 p-4 border-b md:flex-row border-surface-50 dark:border-surface-700 bg-surface-50/50 dark:bg-surface-700/30">
                <div className="flex items-center w-full gap-2 md:w-auto">
                    <Filter size={16} className="text-surface-400" />
                    <select 
                        className="p-2 text-sm bg-white border rounded-lg outline-none border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-200"
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
                    <Search size={16} className="absolute right-3 top-3 text-surface-400" />
                    <input 
                        type="text" 
                        placeholder="חיפוש הוצאה או ספק..." 
                        className="w-full py-2 pl-4 text-sm bg-white border rounded-lg outline-none pr-10 border-surface-200 focus:ring-2 focus:ring-purple-500 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="uppercase bg-surface-50 dark:bg-surface-700/50 text-surface-500 dark:text-surface-400">
                        <tr>
                            <th className="px-6 py-3 text-right">סטטוס</th>
                            <th className="px-6 py-3 text-right">הוצאה</th>
                            <th className="px-6 py-3 text-right">ספק</th>
                            <th className="px-6 py-3 text-right">קטגוריה</th>
                            <th className="px-6 py-3 text-right">סכום</th>
                            <th className="px-6 py-3 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-50 dark:divide-surface-700">
                        {filteredItems.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="py-8 text-center text-surface-400">לא נמצאו הוצאות</td>
                            </tr>
                        ) : filteredItems.map(item => (
                            <tr key={item.id} className="transition hover:bg-purple-50/50 dark:hover:bg-surface-700/50">
                                <td className="px-6 py-3">
                                    <button 
                                        onClick={() => togglePaid(item)}
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition w-fit ${
                                            item.is_paid 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                                            : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600'
                                        }`}
                                    >
                                        {item.is_paid ? <CheckCircle size={12} /> : <Circle size={12} />}
                                        {item.is_paid ? 'שולם' : 'לא שולם'}
                                    </button>
                                </td>
                                <td className="px-6 py-3 font-medium text-surface-800 dark:text-surface-100">{item.title}</td>
                                <td className="px-6 py-3 text-surface-500 dark:text-surface-400">{item.vendor || '-'}</td>
                                <td className="px-6 py-3"><span className="px-2 py-1 text-xs rounded bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300">{item.category}</span></td>
                                <td className="px-6 py-3 font-bold text-surface-700 dark:text-surface-200">₪{item.amount.toLocaleString()}</td>
                                <td className="px-6 py-3 text-center">
                                    <button onClick={() => handleDelete(item.id)} className="p-1 transition text-surface-400 hover:text-red-500">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="w-full max-w-lg overflow-hidden bg-white shadow-2xl dark:bg-surface-800 rounded-2xl animate-fade-in-up">
                  <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-700">
                      <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100">הוספת הוצאה חדשה</h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-surface-200 dark:hover:bg-surface-600"><X size={20} className="text-surface-500 dark:text-surface-400" /></button>
                  </div>
                  
                  <form onSubmit={handleAddItem} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">שם ההוצאה *</label>
                              <input required type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-600 dark:text-surface-100"
                                  value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} placeholder="למשל: צלם מגנטים" />
                          </div>
                          <div>
                              <label className="block mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">ספק (אופציונלי)</label>
                              <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-600 dark:text-surface-100"
                                  value={newItem.vendor} onChange={e => setNewItem({...newItem, vendor: e.target.value})} placeholder="שם העסק" />
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">סכום (₪) *</label>
                              <input required type="number" min="0" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-600 dark:text-surface-100"
                                  value={newItem.amount} onChange={e => setNewItem({...newItem, amount: e.target.value})} />
                          </div>
                          <div>
                              <label className="block mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">קטגוריה</label>
                              <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-600 dark:text-surface-100"
                                  value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                                  {['אולם וקייטרינג', 'צילום', 'מוזיקה', 'ביגוד וטיפוח', 'עיצוב', 'מתנות', 'טקסים', 'כללי', 'אחר'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                          </div>
                      </div>

                      <div>
                          <label className="block mb-1 text-xs font-medium text-surface-500 dark:text-surface-400">הערות</label>
                          <textarea className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm bg-white border-surface-200 dark:bg-surface-900 dark:border-surface-600 dark:text-surface-100" rows="2"
                              value={newItem.notes} onChange={e => setNewItem({...newItem, notes: e.target.value})} placeholder="פרטים נוספים..." />
                      </div>

                      <button type="submit" className="w-full py-2.5 mt-2 font-medium text-white transition bg-purple-600 rounded-xl hover:bg-purple-700">
                          שמור הוצאה
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}