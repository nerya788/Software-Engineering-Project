import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Bell, Settings } from 'lucide-react';
import io from 'socket.io-client';
import Countdown from './Countdown.jsx';

const Dashboard = ({ currentUser, onLogout }) => {
  const categories = ['general', 'vendors', 'budget', 'design', 'guests', 'logistics'];
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [eventForm, setEventForm] = useState({ title: '', eventDate: '', description: '' });
  const [taskForm, setTaskForm] = useState({ title: '', dueDate: '', isDone: false, category: 'general', assigneeName: '', assigneeEmail: '' });

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // בדיקה שהמשתמש קיים
  useEffect(() => {
    if (!currentUser) {
      console.warn('⚠️ אין currentUser ב-Dashboard');
      return;
    }
    if (!currentUser.id) {
      console.warn('⚠️ אין currentUser.id ב-Dashboard:', currentUser);
    } else {
      console.log('✅ currentUser קיים:', currentUser.id, currentUser.email);
    }
  }, [currentUser]);

  const fetchData = async () => {
    if (!currentUser?.id) {
      console.warn('⚠️ אין currentUser.id - לא ניתן לטעון נתונים');
      return;
    }
    
    try {
      console.log('📥 טוען נתונים עבור משתמש:', currentUser.id);
      const [eventsRes, tasksRes, notifRes] = await Promise.all([
        axios.get(`http://localhost:4000/api/events?userId=${currentUser.id}`),
        axios.get(`http://localhost:4000/api/tasks?userId=${currentUser.id}`),
        axios.get(`http://localhost:4000/api/notifications?userId=${currentUser.id}`)
      ]);
      
      console.log('✅ נתונים נטענו:', {
        events: eventsRes.data.length,
        tasks: tasksRes.data.length,
        notifications: notifRes.data.length
      });
      
      setEvents(eventsRes.data || []);
      setTasks(tasksRes.data || []);
      setNotifications(notifRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error('❌ שגיאה בטעינת נתונים:', err);
      console.error('❌ פרטי השגיאה:', err.response?.data || err.message);
      setLoading(false);
      setMessage('שגיאה בטעינת הנתונים. נסה לרענן את הדף.');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  // טעינת נתונים מיד כשהמשתמש מתחבר
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 טוען נתונים עבור משתמש:', currentUser.id);
      setLoading(true);
      fetchData();
    } else {
      console.warn('⚠️ לא ניתן לטעון נתונים - אין currentUser.id');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) return;

    // חיבור ל-Socket
    const socket = io('http://localhost:4000');
    socket.emit('register_user', currentUser.id);
    console.log('🔌 התחבר ל-Socket.io עבור משתמש:', currentUser.id);

    // 1. האזנה להתראות חדשות
    socket.on('new_notification', (newNotif) => {
      console.log('🔔 התקבלה התראה חדשה בזמן אמת!', newNotif);
      setNotifications((prev) => [newNotif, ...prev]);
      setMessage(`התראה חדשה: ${newNotif.message}`);
      setTimeout(() => setMessage(''), 4000);
    });

    // 2. האזנה לשינויי נתונים (סנכרון בין חלונות)
    socket.on('data_changed', () => {
      console.log('🔄 התקבל אות לרענון נתונים - מעדכן מיד');
      fetchData(); // טוען מחדש את האירועים והמשימות מיד
    });

    // 3. רענון אוטומטי כל 30 שניות (גיבוי למקרה ש-Socket לא עובד)
    const refreshInterval = setInterval(() => {
      console.log('🔄 רענון אוטומטי של נתונים');
      fetchData();
    }, 30000);

    return () => {
      clearInterval(refreshInterval);
      socket.disconnect();
    };

  }, [currentUser?.id]);

  // מיון משימות ואירועים לפי תאריך (חייב להיות לפני השימוש ב-nextEvent)
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date) - new Date(b.due_date);
  });

  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.event_date) - new Date(b.event_date);
  });

  const nextEvent = sortedEvents
    .filter(e => new Date(e.event_date) > new Date().setHours(0,0,0,0))[0];

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/events', { userId: currentUser.id, ...eventForm });
      // עדכון מיידי - טוען מחדש את כל הנתונים
      await fetchData();
      setEventForm({ title: '', eventDate: '', description: '' });
      setMessage('האירוע נוצר בהצלחה! 🎉');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { 
      console.error('Error creating event:', err);
      setMessage('שגיאה ביצירת אירוע'); 
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/tasks', { userId: currentUser.id, ...taskForm });
      // עדכון מיידי - טוען מחדש את כל הנתונים
      await fetchData();
      setTaskForm({ title: '', dueDate: '', isDone: false, category: 'general', assigneeName: '', assigneeEmail: '' });
      setMessage('המשימה נוצרה בהצלחה! ✅');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) { 
      console.error('Error creating task:', err);
      setMessage('שגיאה ביצירת משימה'); 
    }
  };

  const updateTask = async (taskId, updates) => {
    try {
      const res = await axios.put(`http://localhost:4000/api/tasks/${taskId}`, updates);
      // עדכון מיידי - טוען מחדש את כל הנתונים
      await fetchData();
    } catch (err) {
      console.error('Error updating task', err);
      setMessage('שגיאה בעדכון משימה');
    }
  };

  const toggleTaskDone = (task) => {
    updateTask(task.id, { isDone: !task.is_done, status: !task.is_done ? 'done' : 'todo' });
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:4000/api/notifications/${id}/read`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error marking notification as read', err);
    }
  };

  const visibleTasks = sortedTasks.filter(task => {
    const statusOk = statusFilter === 'all' || task.status === statusFilter || (statusFilter === 'done' && task.is_done);
    const catOk = categoryFilter === 'all' || task.category === categoryFilter;
    return statusOk && catOk;
  });

  const tasksForSelectedDate = visibleTasks.filter(task => {
    if (!task.due_date) return false;
    return new Date(task.due_date).toDateString() === date.toDateString();
  });

  const eventsForSelectedDate = sortedEvents.filter(e => 
    new Date(e.event_date).toDateString() === date.toDateString()
  );

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasTask = sortedTasks.some(t => t.due_date && new Date(t.due_date).toDateString() === date.toDateString());
      const hasEvent = sortedEvents.some(e => new Date(e.event_date).toDateString() === date.toDateString());
      return (
        <div className="flex justify-center gap-1 mt-1">
          {hasTask && <div className="h-1.5 w-1.5 bg-purple-500 rounded-full" title="יש משימה"></div>}
          {hasEvent && <div className="h-1.5 w-1.5 bg-pink-500 rounded-full" title="יש אירוע"></div>}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans" dir="rtl">
      
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💍</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
              Wedding Planner
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-100 transition text-gray-600"
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-3 border-b bg-gray-50 font-bold text-gray-700 flex justify-between items-center">
                      <span>התראות</span>
                      <span className="text-xs font-normal text-gray-500">{notifications.length} חדשות</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">אין התראות חדשות 🎉</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-3 border-b hover:bg-purple-50 transition flex justify-between items-start gap-3">
                            <div>
                              <p className="text-sm text-gray-700 font-medium">{n.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.created_at).toLocaleDateString('he-IL')}</p>
                            </div>
                            <button 
                              onClick={() => markAsRead(n.id)} 
                              className="text-xs text-purple-600 hover:text-purple-800 font-bold shrink-0 bg-purple-100 px-2 py-1 rounded-md"
                            >
                              ✓
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
             </div>

             <span className="text-gray-600 font-medium hidden md:inline">היי, {currentUser.full_name}</span>
             
             <Link to="/settings" className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition" title="הגדרות">
               <Settings size={20} />
             </Link>

             <button onClick={onLogout} className="text-sm bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 px-4 py-2 rounded-full transition border border-gray-200">
               יציאה
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {nextEvent && <Countdown targetDate={nextEvent.event_date} title={nextEvent.title} />}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-fit">
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">🗓️ לוח שנה</h2>
              <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md transition ${viewMode === 'month' ? 'bg-white shadow text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  חודש
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-md transition ${viewMode === 'week' ? 'bg-white shadow text-purple-600 font-bold' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  שבוע
                </button>
              </div>
            </div>

            <div className="ltr-calendar"> 
              {viewMode === 'month' ? (
                <Calendar onChange={setDate} value={date} tileContent={tileContent} locale="he-IL" />
              ) : (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const curr = new Date(date);
                    const firstDay = curr.getDate() - curr.getDay(); 
                    const weekDate = new Date(curr.setDate(firstDay + i));
                    const isSelected = weekDate.toDateString() === date.toDateString();

                    const hasEv = sortedEvents.some(e => new Date(e.event_date).toDateString() === weekDate.toDateString());
                    const hasTask = sortedTasks.some(t => t.due_date && new Date(t.due_date).toDateString() === weekDate.toDateString());

                    return (
                      <div 
                        key={i} 
                        onClick={() => setDate(weekDate)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex justify-between items-center
                          ${isSelected ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-100' : 'bg-gray-50 border-gray-100 hover:bg-white'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                           <span className={`font-bold ${isSelected ? 'text-purple-700' : 'text-gray-600'}`}>
                             {weekDate.toLocaleDateString('he-IL', { weekday: 'long' })}
                           </span>
                           <span className="text-xs text-gray-400">
                             {weekDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                           </span>
                        </div>
                        <div className="flex gap-1">
                          {hasTask && <div className="w-2 h-2 bg-purple-500 rounded-full" title="משימה"></div>}
                          {hasEv && <div className="w-2 h-2 bg-pink-500 rounded-full" title="אירוע"></div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col min-h-[500px]">
            <div className="flex flex-col gap-4 mb-6 border-b border-gray-100 pb-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-gray-500 text-sm mb-1">משימות ואירועים עבור</p>
                  <h2 className="text-2xl font-bold text-gray-800">
                    {date.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${visibleTasks.length > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                  {visibleTasks.length} משימות
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white">
                  <option value="all">כל הסטטוסים</option>
                  <option value="todo">פתוחות</option>
                  <option value="in_progress">בתהליך</option>
                  <option value="done">הושלמו</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white">
                  <option value="all">כל הקטגוריות</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {/* הצגת כל האירועים - לא רק של התאריך הנבחר */}
              {sortedEvents.length > 0 && sortedEvents.map(ev => (
                <div key={ev.id} className="p-4 bg-gradient-to-r from-pink-50 to-white border-r-4 border-pink-500 rounded-xl shadow-sm mb-3">
                  <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-gray-800">{ev.title}</h3>
                        <p className="text-sm text-gray-500">{ev.description || 'אין תיאור'}</p>
                        <p className="text-xs text-gray-400 mt-1">📅 {new Date(ev.event_date).toLocaleDateString('he-IL')}</p>
                    </div>
                    <Link to={`/events/${ev.id}/edit`} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-50">
                        ערוך
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* הצגת כל המשימות המסוננות - לא רק של התאריך הנבחר */}
              {visibleTasks.length === 0 ? (
                sortedEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-2xl">☕</div>
                    <p className="text-lg font-medium">אין משימות או אירועים</p>
                    <p className="text-sm opacity-70">יום חופש! או שתוסיף משימה/אירוע למטה?</p>
                  </div>
                )
              ) : (
                visibleTasks.map(task => (
                  <div key={task.id} className="group flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-white hover:shadow-md hover:border-purple-100 transition duration-200">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTaskDone(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.is_done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-purple-400'}`}
                        title="סמן כהושלם"
                      >
                        {task.is_done && <span className="text-white text-xs">✓</span>}
                      </button>
                      <div>
                        <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          <span className={`px-2 py-0.5 rounded-md ${task.is_done ? 'bg-green-100 text-green-700' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {task.is_done ? 'הושלם' : task.status === 'in_progress' ? 'בתהליך' : 'פתוחה'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">קטגוריה: {task.category || 'כללי'}</span>
                          {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">אחראי: {task.assignee_name}</span>}
                          {task.due_date && <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700">דדליין: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* משימות באיחור */}
        {(() => {
          const overdueTasks = sortedTasks.filter(task => 
            task.due_date && 
            new Date(task.due_date) < new Date() && 
            !task.is_done
          );
          return overdueTasks.length > 0 && (
            <section className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                  ⚠️ משימות באיחור ({overdueTasks.length})
                </h2>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                <div className="space-y-3">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-red-200 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleTaskDone(task)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.is_done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-red-400'}`}
                          title="סמן כהושלם"
                        >
                          {task.is_done && <span className="text-white text-xs">✓</span>}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">באיחור</span>
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">קטגוריה: {task.category || 'כללי'}</span>
                            {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">אחראי: {task.assignee_name}</span>}
                            {task.due_date && <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700">דדליין: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* כל המשימות (חוץ מהושלמו) */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">כל המשימות</h2>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          
          {loading ? (
            <div className="text-center py-10">טוען נתונים...</div>
          ) : (() => {
            const activeTasks = sortedTasks.filter(task => !task.is_done);
            return activeTasks.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500">אין משימות פעילות. כל המשימות הושלמו! 🎉</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="space-y-3">
                  {activeTasks.map(task => (
                    <div key={task.id} className="p-4 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => toggleTaskDone(task)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.is_done ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-purple-400'}`}
                          title="סמן כהושלם"
                        >
                          {task.is_done && <span className="text-white text-xs">✓</span>}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-md ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                              {task.status === 'in_progress' ? 'בתהליך' : 'פתוחה'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">קטגוריה: {task.category || 'כללי'}</span>
                            {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700">אחראי: {task.assignee_name}</span>}
                            {task.due_date && (
                              <span className={`px-2 py-0.5 rounded-md ${
                                new Date(task.due_date) < new Date() 
                                  ? 'bg-red-50 text-red-700 font-bold' 
                                  : 'bg-pink-50 text-pink-700'
                              }`}>
                                דדליין: {new Date(task.due_date).toLocaleDateString('he-IL')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-800">האירועים שלי</h2>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>
          
          {loading ? <div className="text-center py-10">טוען נתונים...</div> : sortedEvents.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-500">עדיין אין אירועים. צור את האירוע הראשון שלך למטה!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedEvents.map(ev => (
                <div key={ev.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{ev.title}</h3>
                  <p className="text-gray-500 mb-8 flex items-center gap-2 text-sm bg-gray-50 w-fit px-3 py-1 rounded-full">
                    📅 {new Date(ev.event_date).toLocaleDateString('he-IL')}
                  </p>
                  
                  <Link 
                    to={`/events/${ev.id}/guests`} 
                    className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-medium py-3 rounded-xl hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                  >
                    <span>📋</span> ניהול רשימת מוזמנים
                  </Link>

                  <Link 
                    to={`/events/${ev.id}/edit`} 
                    className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200 text-gray-700 font-medium py-2 rounded-xl hover:bg-gray-50 transition mt-3"
                  >
                    <span>✏️</span> עריכת פרטים
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-purple-100 p-2 rounded-lg text-purple-600 text-sm">✚</span> 
              משימה חדשה
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">מה צריך לעשות?</label>
                <input type="text" placeholder="למשל: לקבוע פגישה עם הצלם..." className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition" 
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
                <input type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition" 
                  value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">קטגוריה</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition"
                    value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סטטוס</label>
                  <select className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition"
                    value={taskForm.status || 'todo'} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    <option value="todo">פתוחה</option>
                    <option value="in_progress">בתהליך</option>
                    <option value="done">הושלמה</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אחראי (שם)</label>
                  <input type="text" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition"
                    value={taskForm.assigneeName} onChange={e => setTaskForm({...taskForm, assigneeName: e.target.value})} placeholder="שם האחראי" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אחראי (אימייל)</label>
                  <input type="email" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-200 outline-none transition"
                    value={taskForm.assigneeEmail} onChange={e => setTaskForm({...taskForm, assigneeEmail: e.target.value})} placeholder="email@example.com" />
                </div>
              </div>
              <button className="w-full bg-purple-600 text-white font-bold py-3.5 rounded-xl hover:bg-purple-700 transition shadow-lg shadow-purple-200 mt-2">
                הוסף משימה לרשימה
              </button>
            </form>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="bg-pink-100 p-2 rounded-lg text-pink-600 text-sm">✚</span> 
              אירוע חדש
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">שם האירוע</label>
                <input type="text" placeholder="למשל: חינה / שבת חתן / חתונה" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none transition" 
                  value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                   <input type="date" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none transition" 
                    value={eventForm.eventDate} onChange={e => setEventForm({...eventForm, eventDate: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">תיאור (אופציונלי)</label>
                   <input type="text" placeholder="פרטים..." className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-pink-200 outline-none transition" 
                    value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
                 </div>
              </div>
              <button className="w-full bg-pink-500 text-white font-bold py-3.5 rounded-xl hover:bg-pink-600 transition shadow-lg shadow-pink-200 mt-2">
                צור אירוע חדש
              </button>
            </form>
          </div>
        </div>

        {message && (
          <div className="fixed bottom-8 left-8 bg-gray-900/90 backdrop-blur text-white px-6 py-4 rounded-2xl shadow-2xl animate-fade-in-up flex items-center gap-3 z-50">
            <span className="text-xl">✨</span> {message}
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;