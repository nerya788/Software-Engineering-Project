import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client'; // ✅ מהקובץ של החבר
import './App.css';
import { API_URL } from './config'; // ✅ מהקובץ של החבר
import SeatingArrangements from './components/SeatingArrangements'; // <<< IMPORT THIS
// רכיבים
import Auth from './components/Auth';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';
import Settings from './components/Settings';
import BudgetDashboard from './components/BudgetDashboard';
import VendorList from './components/VendorList'; // ✅ מהקובץ שלך (ניהול ספקים)

// >>> ADDED: Tips page
import Tips from './components/Tips';
// <<< ADDED: Tips page

// >>> ADDED: Public RSVP page
import RsvpPage from './components/RsvpPage';
// <<< ADDED: Public RSVP page

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ 1. טעינת משתמש מהזיכרון (מהקובץ שלך) - מונע התנתקות ברענון
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
  }, []);

  // ✅ 2. הנדלרים עם שמירה לזיכרון (מהקובץ שלך)
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  // ✅ 3. Observer Logic עם סוקט (מהקובץ של החבר) - סנכרון הגדרות בזמן אמת
  useEffect(() => {
    if (currentUser?.id) {
      console.log('🔄 App: Connecting global socket for user sync...');
      const socket = io(API_URL, { transports: ['websocket'] });

      // הרשמה לחדר של המשתמש
      socket.emit('register_user', currentUser.id);

      // האזנה לאירוע שהוספנו בשרת: user_updated
      socket.on('user_updated', (updatedUser) => {
        console.log('✨ App: User data updated from server:', updatedUser);
        
        // עדכון ה-State וגם ה-LocalStorage כדי שהסנכרון יישמר
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [currentUser?.id]);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-50">
      
      <div className="fixed top-4 left-4 z-50">
        <ThemeToggle />
      </div>

      <Router>
        <div className="container mx-auto px-4 py-8">
          <Routes>

            {/* ✅ RSVP ציבורי - עובד גם בלי משתמש מחובר */}
            <Route path="/rsvp/e/:eventId" element={<RsvpPage />} />

            {/* נתיבים למשתמש לא מחובר */}
            {!currentUser ? (
              <Route path="*" element={<Auth onLogin={handleLogin} />} />
            ) : (
              /* נתיבים למשתמש מחובר */
              <>
                <Route path="/" element={<Dashboard currentUser={currentUser} onLogout={handleLogout} />} />
                
                {/* ✅ הוספנו את הנתיב לספקים (מהקובץ שלך) */}
                <Route path="/vendors" element={<VendorList />} />

                {/* >>> ADDED: route לטיפים */}
                <Route path="/tips" element={<Tips />} />
                {/* <<< ADDED: route לטיפים */}
                
                {/* ✅ שימוש בגרסה של החבר שמעבירה currentUser למוזמנים */}
                <Route path="/events/:eventId/guests" element={<GuestList currentUser={currentUser} />} />
                
                <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
                <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
                
                <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateUser={handleLogin} />} />
                
                <Route path="*" element={<Navigate to="/" />} />
                
                <Route path="/events/:eventId/seating" element={<SeatingArrangements currentUser={currentUser} />} />
              </>
            )}
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
