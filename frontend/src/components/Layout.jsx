import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API_URL } from '../config';

const Layout = ({ currentUser, onLogout }) => {
  const [mainEventId, setMainEventId] = useState(null);

  useEffect(() => {
    if (currentUser?.id) {
        axios.get(`${API_URL}/api/events?userId=${currentUser.id}`)
             .then(res => {
                const events = res.data || [];
                // ננסה למצוא קודם כל אירוע שמוגדר כ"חתונה", אחרת ניקח את הראשון
                const wedding = events.find(e => e.title.includes('חתונה') || e.title.toLowerCase().includes('wedding'));
                setMainEventId(wedding ? wedding.id : (events[0]?.id || null));
             })
             .catch(e => console.error(e));
    }
  }, [currentUser]);

  return (
    // הוספתי כאן classes למצב כהה: dark:bg-gray-900 dark:text-gray-100
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300" dir="rtl">
      
      <Sidebar currentUser={currentUser} onLogout={onLogout} mainEventId={mainEventId} />
      
      {/* הסרתי את p-8 כדי לאפשר לדשבורד לשלוט על הרקע והריווח בצורה מלאה.
        זה קריטי כדי שהעיצוב יראה מקצועי וללא "שוליים" לבנים במצב כהה.
      */}
      <main className="flex-1 overflow-y-auto">
         <Outlet />
      </main>
      
    </div>
  );
};

export default Layout;