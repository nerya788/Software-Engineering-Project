import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Bell, Settings, Wallet } from 'lucide-react';
import io from 'socket.io-client';
import Countdown from './Countdown.jsx';
import { API_URL } from '../config';

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
        axios.get(`${API_URL}/api/events?userId=${currentUser.id}`),
        axios.get(`${API_URL}/api/tasks?userId=${currentUser.id}`),
        axios.get(`${API_URL}/api/notifications?userId=${currentUser.id}`)
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
    const socket = io(API_URL);
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

  // מיון משימות ואירועים לפי תאריך
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
      await axios.post(`${API_URL}/api/events`, { userId: currentUser.id, ...eventForm });
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
      await axios.post(`${API_URL}/api/tasks`, { userId: currentUser.id, ...taskForm });
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
      await axios.put(`${API_URL}/api/tasks/${taskId}`, updates);
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
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
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
    <div className="min-h-screen pb-20 font-sans transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50" dir="rtl">
      
      <header className="sticky top-0 z-50 border-b shadow-sm bg-white/80 dark:bg-surface-800/80 backdrop-blur-md border-surface-100 dark:border-surface-700">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💍</span>
            <h1 className="text-2xl font-bold text-transparent bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text">
              Wedding Planner
            </h1>
          </div>

          <div className="flex items-center gap-4">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 transition rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300"
                >
                  <Bell size={24} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 z-50 overflow-hidden bg-white border shadow-2xl mt-3 w-80 rounded-xl dark:bg-surface-800 border-surface-100 dark:border-surface-700">
                    <div className="flex items-center justify-between p-3 font-bold border-b bg-surface-50 dark:bg-surface-700 border-surface-100 dark:border-surface-600 text-surface-700 dark:text-surface-200">
                      <span>התראות</span>
                      <span className="text-xs font-normal text-surface-500 dark:text-surface-400">{notifications.length} חדשות</span>
                    </div>
                    <div className="overflow-y-auto max-h-64 custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-sm text-center text-surface-400">אין התראות חדשות 🎉</div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="flex items-start justify-between gap-3 p-3 transition border-b dark:border-surface-700 hover:bg-purple-50 dark:hover:bg-surface-700">
                            <div>
                              <p className="text-sm font-medium text-surface-700 dark:text-surface-200">{n.message}</p>
                              <p className="mt-1 text-xs text-surface-400">{new Date(n.created_at).toLocaleDateString('he-IL')}</p>
                            </div>
                            <button 
                              onClick={() => markAsRead(n.id)} 
                              className="px-2 py-1 text-xs font-bold text-purple-600 rounded-md shrink-0 bg-purple-100 hover:text-purple-800 dark:bg-purple-900/50 dark:text-purple-300"
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

             <span className="hidden font-medium text-surface-600 dark:text-surface-300 md:inline">היי, {currentUser.full_name}</span>
             
             <Link to="/settings" className="p-2 transition rounded-full hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300" title="הגדרות">
               <Settings size={20} />
             </Link>

             <button onClick={onLogout} className="px-4 py-2 text-sm transition border rounded-full bg-surface-100 dark:bg-surface-700 dark:border-surface-600 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300 text-surface-700 dark:text-surface-200 border-surface-200">
               יציאה
             </button>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 mx-auto max-w-7xl">
        
        {nextEvent && <Countdown targetDate={nextEvent.event_date} title={nextEvent.title} />}

        <div className="grid grid-cols-1 gap-8 mb-12 lg:grid-cols-12">
          
          <div className="h-fit lg:col-span-4 p-6 bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-100 dark:border-surface-700">
            
            <div className="flex items-center justify-between mb-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-surface-800 dark:text-surface-100">🗓️ לוח שנה</h2>
              <div className="flex p-1 rounded-lg bg-surface-100 dark:bg-surface-700 text-sm">
                <button 
                  onClick={() => setViewMode('month')}
                  className={`px-3 py-1 rounded-md transition ${viewMode === 'month' ? 'bg-white dark:bg-surface-600 shadow text-purple-600 dark:text-purple-300 font-bold' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700'}`}
                >
                  חודש
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={`px-3 py-1 rounded-md transition ${viewMode === 'week' ? 'bg-white dark:bg-surface-600 shadow text-purple-600 dark:text-purple-300 font-bold' : 'text-surface-500 dark:text-surface-400 hover:text-surface-700'}`}
                >
                  שבוע
                </button>
              </div>
            </div>

            <div className="ltr-calendar dark:text-surface-200"> 
              {viewMode === 'month' ? (
                <Calendar onChange={setDate} value={date} tileContent={tileContent} locale="he-IL" className="dark:bg-surface-800 dark:text-surface-200 react-calendar-dark" />
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
                          ${isSelected ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-100 dark:ring-purple-900' : 'bg-surface-50 dark:bg-surface-700 border-surface-100 dark:border-surface-600 hover:bg-white dark:hover:bg-surface-600'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                           <span className={`font-bold ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-surface-600 dark:text-surface-300'}`}>
                             {weekDate.toLocaleDateString('he-IL', { weekday: 'long' })}
                           </span>
                           <span className="text-xs text-surface-400">
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

          <div className="flex flex-col lg:col-span-8 p-8 bg-white dark:bg-surface-800 rounded-3xl shadow-sm border border-surface-100 dark:border-surface-700 min-h-[500px]">
            <div className="flex flex-col gap-4 pb-4 mb-6 border-b border-surface-100 dark:border-surface-700">
              <div className="flex items-end justify-between">
                <div>
                  <p className="mb-1 text-sm text-surface-500 dark:text-surface-400">משימות ואירועים עבור</p>
                  <h2 className="text-2xl font-bold text-surface-800 dark:text-surface-100">
                    {date.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h2>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold ${visibleTasks.length > 0 ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-surface-100 dark:bg-surface-700 text-surface-500 dark:text-surface-400'}`}>
                  {visibleTasks.length} משימות
                </span>
              </div>
              <div className="flex flex-wrap gap-3">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border rounded-xl border-surface-200 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200">
                  <option value="all">כל הסטטוסים</option>
                  <option value="todo">פתוחות</option>
                  <option value="in_progress">בתהליך</option>
                  <option value="done">הושלמו</option>
                </select>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-2 text-sm bg-white border rounded-xl border-surface-200 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200">
                  <option value="all">כל הקטגוריות</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="flex-1 pr-2 space-y-3 overflow-y-auto custom-scrollbar">
              {/* הצגת כל האירועים */}
              {sortedEvents.length > 0 && sortedEvents.map(ev => (
                <div key={ev.id} className="p-4 mb-3 border-r-4 border-pink-500 shadow-sm bg-gradient-to-r from-pink-50 to-white dark:from-surface-700 dark:to-surface-800 rounded-xl">
                  <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-surface-800 dark:text-surface-100">{ev.title}</h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">{ev.description || 'אין תיאור'}</p>
                        <p className="mt-1 text-xs text-surface-400">📅 {new Date(ev.event_date).toLocaleDateString('he-IL')}</p>
                    </div>
                    <Link to={`/events/${ev.id}/edit`} className="px-2 py-1 text-xs bg-white border rounded border-surface-200 dark:bg-surface-700 dark:border-surface-600 hover:bg-surface-50 dark:text-surface-200">
                        ערוך
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* הצגת כל המשימות המסוננות */}
              {visibleTasks.length === 0 ? (
                sortedEvents.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-surface-400">
                    <div className="flex items-center justify-center w-16 h-16 mb-3 text-2xl rounded-full bg-surface-50 dark:bg-surface-700">☕</div>
                    <p className="text-lg font-medium">אין משימות או אירועים</p>
                    <p className="text-sm opacity-70">יום חופש! או שתוסיף משימה/אירוע למטה?</p>
                  </div>
                )
              ) : (
                visibleTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 transition duration-200 border group bg-surface-50 dark:bg-surface-700/50 border-surface-100 dark:border-surface-700 rounded-2xl hover:bg-white dark:hover:bg-surface-700 hover:shadow-md hover:border-purple-100 dark:hover:border-purple-900">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => toggleTaskDone(task)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.is_done ? 'bg-green-500 border-green-500' : 'border-surface-300 dark:border-surface-500 hover:border-purple-400'}`}
                        title="סמן כהושלם"
                      >
                        {task.is_done && <span className="text-xs text-white">✓</span>}
                      </button>
                      <div>
                        <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-surface-400' : 'text-surface-800 dark:text-surface-100'}`}>
                          {task.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs">
                          <span className={`px-2 py-0.5 rounded-md ${task.is_done ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                            {task.is_done ? 'הושלם' : task.status === 'in_progress' ? 'בתהליך' : 'פתוחה'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 dark:bg-surface-600 dark:text-surface-200">קטגוריה: {task.category || 'כללי'}</span>
                          {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">אחראי: {task.assignee_name}</span>}
                          {task.due_date && <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">דדליין: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
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
                <h2 className="flex items-center gap-2 text-2xl font-bold text-red-600 dark:text-red-400">
                  ⚠️ משימות באיחור ({overdueTasks.length})
                </h2>
                <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
              </div>
              <div className="p-6 border-2 border-red-200 rounded-2xl bg-red-50 dark:bg-red-900/10 dark:border-red-900/50">
                <div className="space-y-3">
                  {overdueTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-xl dark:bg-surface-800 dark:border-red-900/30">
                      <div className="flex items-center flex-1 gap-4">
                        <button
                          onClick={() => toggleTaskDone(task)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.is_done ? 'bg-green-500 border-green-500' : 'border-surface-300 dark:border-surface-500 hover:border-red-400'}`}
                          title="סמן כהושלם"
                        >
                          {task.is_done && <span className="text-xs text-white">✓</span>}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-surface-400' : 'text-surface-800 dark:text-surface-100'}`}>
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs">
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold">באיחור</span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 dark:bg-surface-600 dark:text-surface-200">קטגוריה: {task.category || 'כללי'}</span>
                            {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">אחראי: {task.assignee_name}</span>}
                            {task.due_date && <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">דדליין: {new Date(task.due_date).toLocaleDateString('he-IL')}</span>}
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

        {/* כל המשימות */}
        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-surface-800 dark:text-surface-100">כל המשימות</h2>
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
          </div>
          
          {loading ? (
            <div className="py-10 text-center text-surface-500 dark:text-surface-400">טוען נתונים...</div>
          ) : (() => {
            const activeTasks = sortedTasks.filter(task => !task.is_done);
            return activeTasks.length === 0 ? (
              <div className="py-10 text-center bg-white border border-dashed rounded-2xl border-surface-300 dark:bg-surface-800 dark:border-surface-600">
                <p className="text-surface-500 dark:text-surface-400">אין משימות פעילות. כל המשימות הושלמו! 🎉</p>
              </div>
            ) : (
              <div className="p-6 bg-white border rounded-2xl border-surface-100 dark:bg-surface-800 dark:border-surface-700">
                <div className="space-y-3">
                  {activeTasks.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-4 transition border rounded-xl bg-surface-50 border-surface-100 dark:bg-surface-700 dark:border-surface-600 hover:bg-white dark:hover:bg-surface-600 hover:shadow-md">
                      <div className="flex items-center flex-1 gap-4">
                        <button
                          onClick={() => toggleTaskDone(task)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.is_done ? 'bg-green-500 border-green-500' : 'border-surface-300 dark:border-surface-500 hover:border-purple-400'}`}
                          title="סמן כהושלם"
                        >
                          {task.is_done && <span className="text-xs text-white">✓</span>}
                        </button>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${task.is_done ? 'line-through text-surface-400' : 'text-surface-800 dark:text-surface-100'}`}>
                            {task.title}
                          </h3>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs">
                            <span className={`px-2 py-0.5 rounded-md ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                              {task.status === 'in_progress' ? 'בתהליך' : 'פתוחה'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-surface-100 text-surface-700 dark:bg-surface-600 dark:text-surface-200">קטגוריה: {task.category || 'כללי'}</span>
                            {task.assignee_name && <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">אחראי: {task.assignee_name}</span>}
                            {task.due_date && (
                              <span className={`px-2 py-0.5 rounded-md ${
                                new Date(task.due_date) < new Date() 
                                  ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 font-bold' 
                                  : 'bg-pink-50 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300'
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
            <h2 className="text-2xl font-bold text-surface-800 dark:text-surface-100">האירועים שלי</h2>
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
          </div>
          
          {loading ? <div className="py-10 text-center text-surface-500 dark:text-surface-400">טוען נתונים...</div> : sortedEvents.length === 0 ? (
            <div className="py-10 text-center bg-white border border-dashed rounded-2xl border-surface-300 dark:bg-surface-800 dark:border-surface-600">
              <p className="text-surface-500 dark:text-surface-400">עדיין אין אירועים. צור את האירוע הראשון שלך למטה!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedEvents.map(ev => (
                <div key={ev.id} className="relative overflow-hidden transition duration-300 bg-white border shadow-sm group rounded-3xl dark:bg-surface-800 border-surface-100 dark:border-surface-700 p-6 hover:shadow-xl hover:-translate-y-1">
                  <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-purple-500 to-pink-500"></div>
                  <h3 className="mb-2 text-xl font-bold text-surface-800 dark:text-surface-100">{ev.title}</h3>
                  <p className="flex items-center w-fit gap-2 px-3 py-1 mb-8 text-sm rounded-full text-surface-500 dark:text-surface-300 bg-surface-50 dark:bg-surface-700">
                    📅 {new Date(ev.event_date).toLocaleDateString('he-IL')}
                  </p>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Link 
                      to={`/events/${ev.id}/guests`} 
                      className="flex items-center justify-center w-full gap-2 py-3 font-medium text-white transition bg-gray-900 rounded-xl hover:bg-gray-800 shadow-lg shadow-gray-200 dark:shadow-none"
                    >
                      <span>📋</span> ניהול רשימת מוזמנים
                    </Link>

                    <Link 
                      to={`/events/${ev.id}/budget`} 
                      className="flex items-center justify-center w-full gap-2 py-3 font-medium text-white transition bg-emerald-500 rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none"
                    >
                      <Wallet size={18} /> ניהול תקציב
                    </Link>

                    <Link 
                      to={`/events/${ev.id}/edit`} 
                      className="flex items-center justify-center w-full gap-2 py-2 font-medium transition bg-white border rounded-xl border-surface-200 text-surface-700 hover:bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-600"
                    >
                      <span>✏️</span> עריכת פרטים
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-surface-800 dark:text-surface-100">ניהול שוטף</h2>
            <div className="flex-1 h-px bg-surface-200 dark:bg-surface-700"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* כרטיסייה לניהול ספקים */}
            <Link to="/vendors" className="relative overflow-hidden group bg-white dark:bg-surface-800 p-6 rounded-3xl shadow-sm border border-surface-100 dark:border-surface-700 hover:shadow-xl hover:-translate-y-1 transition duration-300">
              {/* פס צבע קישוטי בצד */}
              <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-500 to-cyan-400"></div>
              
              <div className="flex items-center justify-between mb-4 pl-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  {/* אייקון ספקים (Handshake) */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.05l1.86 1.86a1.98 1.98 0 0 1 0 2.82l-.71.71"/><path d="m11 17a1 1 0 0 1-1.41 0L5 12.41a1 1 0 0 1 0-1.41l8.29-8.29a.6.6 0 0 1 .85 0l3.75 3.75a.6.6 0 0 1 0 .85L11 14.14"/></svg>
                </div>
                <span className="text-3xl opacity-20">📋</span>
              </div>
              
              <div className="pl-2">
                <h3 className="text-xl font-bold text-surface-800 dark:text-surface-100 mb-2">ניהול ספקים ונותני שירות</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">
                  מרכז את כל אנשי המקצוע במקום אחד: צלמים, קייטרינג, ואולם. 
                  כולל שמירת הצעות מחיר ודירוג אישי.
                </p>
              </div>
            </Link>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          
          <div className="p-8 bg-white border shadow-sm dark:bg-surface-800 rounded-3xl border-surface-100 dark:border-surface-700">
            <h3 className="flex items-center gap-2 mb-6 text-xl font-bold text-surface-800 dark:text-surface-100">
              <span className="p-2 text-sm text-purple-600 rounded-lg bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300">✚</span> 
              משימה חדשה
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">מה צריך לעשות?</label>
                <input type="text" placeholder="למשל: לקבוע פגישה עם הצלם..." className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800" 
                  value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">תאריך יעד</label>
                <input type="date" className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800" 
                  value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} required />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">קטגוריה</label>
                  <select className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                    value={taskForm.category} onChange={e => setTaskForm({...taskForm, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">סטטוס</label>
                  <select className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                    value={taskForm.status || 'todo'} onChange={e => setTaskForm({...taskForm, status: e.target.value})}>
                    <option value="todo">פתוחה</option>
                    <option value="in_progress">בתהליך</option>
                    <option value="done">הושלמה</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">אחראי (שם)</label>
                  <input type="text" className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                    value={taskForm.assigneeName} onChange={e => setTaskForm({...taskForm, assigneeName: e.target.value})} placeholder="שם האחראי" />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">אחראי (אימייל)</label>
                  <input type="email" className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800"
                    value={taskForm.assigneeEmail} onChange={e => setTaskForm({...taskForm, assigneeEmail: e.target.value})} placeholder="email@example.com" />
                </div>
              </div>
              <button className="w-full py-3.5 mt-2 font-bold text-white transition bg-purple-600 rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-200 dark:shadow-none">
                הוסף משימה לרשימה
              </button>
            </form>
          </div>

          <div className="p-8 bg-white border shadow-sm dark:bg-surface-800 rounded-3xl border-surface-100 dark:border-surface-700">
            <h3 className="flex items-center gap-2 mb-6 text-xl font-bold text-surface-800 dark:text-surface-100">
              <span className="p-2 text-sm text-pink-600 rounded-lg bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300">✚</span> 
              אירוע חדש
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">שם האירוע</label>
                <input type="text" placeholder="למשל: חינה / שבת חתן / חתונה" className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800" 
                  value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">תאריך</label>
                   <input type="date" className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800" 
                    value={eventForm.eventDate} onChange={e => setEventForm({...eventForm, eventDate: e.target.value})} required />
                 </div>
                 <div>
                   <label className="block mb-1 text-sm font-medium text-surface-700 dark:text-surface-300">תיאור (אופציונלי)</label>
                   <input type="text" placeholder="פרטים..." className="w-full p-3 transition border outline-none bg-surface-50 dark:bg-surface-700 dark:border-surface-600 dark:text-white border-surface-100 rounded-xl focus:ring-2 focus:ring-pink-200 dark:focus:ring-pink-800" 
                    value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})} />
                 </div>
              </div>
              <button className="w-full py-3.5 mt-2 font-bold text-white transition bg-pink-500 rounded-xl hover:bg-pink-600 shadow-lg shadow-pink-200 dark:shadow-none">
                צור אירוע חדש
              </button>
            </form>
          </div>
        </div>

        {message && (
          <div className="fixed z-50 flex items-center gap-3 px-6 py-4 text-white shadow-2xl bottom-8 left-8 bg-gray-900/90 backdrop-blur rounded-2xl animate-fade-in-up">
            <span className="text-xl">✨</span> {message}
          </div>
        )}

      </main>
    </div>
  );
};

export default Dashboard;