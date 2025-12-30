import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import './App.css';
import { API_URL } from './config';

// רכיבים
import Auth from './components/Auth';
import ThemeToggle from './components/ThemeToggle';
import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';
import Settings from './components/Settings';
import BudgetDashboard from './components/BudgetDashboard';
import VendorList from './components/VendorList'; // ✅ הוספנו את זה

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // ✅ טעינת משתמש מהזיכרון בטעינת האפליקציה (מונע התנתקות ברענון)
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

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // ✅ שמירה בזיכרון
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user'); // ✅ מחיקה מהזיכרון
  };

  // האזנה לשינויים בפרטי המשתמש דרך הסוקט
  useEffect(() => {
    if (currentUser?.id) {
      const socket = io(API_URL, { transports: ['websocket'] });
      socket.emit('register_user', currentUser.id);

      socket.on('user_updated', (updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // עדכון גם בזיכרון
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
            {!currentUser ? (
              <Route path="*" element={<Auth onLogin={handleLogin} />} />
            ) : (
              <>
                <Route path="/" element={<Dashboard currentUser={currentUser} onLogout={handleLogout} />} />
                
                {/* ✅ הוספנו את הנתיב לספקים */}
                <Route path="/vendors" element={<VendorList />} />
                
                <Route path="/events/:eventId/guests" element={<GuestList currentUser={currentUser} />} />
                <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
                <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
                <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateUser={setCurrentUser} />} />
                
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