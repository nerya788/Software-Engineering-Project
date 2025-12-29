import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client'; // ייבוא הסוקט
import './App.css';
import { API_URL } from './config'; // ייבוא כתובת השרת

// רכיבים
import Auth from './components/Auth';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';
import Settings from './components/Settings';
import BudgetDashboard from './components/BudgetDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- 🔥 Observer Logic: סנכרון משתמש גלובלי ---
  // האזנה לשינויים בפרטי המשתמש (כגון הגדרות) דרך הסוקט
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 App: Connecting global socket for user sync...');
      const socket = io(API_URL, { transports: ['websocket'] });

      // הרשמה לחדר של המשתמש
      socket.emit('register_user', currentUser.id);

      // האזנה לאירוע שהוספנו בשרת: user_updated
      socket.on('user_updated', (updatedUser) => {
        console.log('✨ App: User data updated from server (Cross-tab sync):', updatedUser);
        
        // עדכון ה-State הגלובלי, מה שיגרום לכל הרכיבים להתעדכן מיד
        setCurrentUser(updatedUser);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser?.id]);
  // ------------------------------------------------

  return (
    // ה-Div הזה עוטף את כל האפליקציה ודואג לרקע אחיד ביום ובלילה
    <div className="min-h-screen transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
      
      {/* כפתור החלפת נושא צף */}
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <Router>
        <div className="container mx-auto px-4 py-8">
          <Routes>
            {/* נתיבים למשתמש לא מחובר */}
            {!currentUser ? (
              <Route path="*" element={<Auth onLogin={handleLogin} />} />
            ) : (
              /* נתיבים למשתמש מחובר */
              <>
                <Route path="/" element={<Dashboard currentUser={currentUser} onLogout={handleLogout} />} />
                
                {/* העברנו את currentUser כדי לאפשר חיבור סוקט פנימי ברשימת המוזמנים */}
                <Route path="/events/:eventId/guests" element={<GuestList currentUser={currentUser} />} />
                
                <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
                <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
                
                {/* onUpdateUser מאפשר עדכון מהיר, הסוקט מטפל בסנכרון בין חלונות */}
                <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
                
                {/* ניתוב ברירת מחדל למחוברים */}
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;