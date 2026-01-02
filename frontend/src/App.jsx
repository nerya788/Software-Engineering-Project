// src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client'; 
import './App.css';
import { API_URL } from './config'; 

// --- רכיבים קיימים ---
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';
import Settings from './components/Settings';
import BudgetDashboard from './components/BudgetDashboard';
import VendorList from './components/VendorList'; 
import Tips from './components/Tips';
import RsvpPage from './components/RsvpPage';
import SeatingArrangements from './components/SeatingArrangements';

// --- הרכיב החדש (Layout) שעוטף את העיצוב ---
// וודא שיצרת את הקובץ הזה ב-src/components/Layout.jsx
import Layout from './components/Layout'; 

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // 1. טעינת משתמש
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try { setCurrentUser(JSON.parse(storedUser)); } catch (e) { console.error("LS Error"); }
    }
  }, []);

  // 2. הנדלרים
  const handleLogin = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  // 3. סוקט (Socket)
  useEffect(() => {
    if (currentUser?.id) {
      const socket = io(API_URL, { transports: ['websocket'] });
      socket.emit('register_user', currentUser.id);
      socket.on('user_updated', (updatedUser) => {
        setCurrentUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      });
      return () => socket.disconnect();
    }
  }, [currentUser?.id]);

  return (
    <Router>
        <Routes>
          {/* דפים ציבוריים (בלי תפריט צד) */}
          <Route path="/rsvp/e/:eventId" element={<RsvpPage />} />

          {/* משתמש לא מחובר -> מסך כניסה */}
          {!currentUser ? (
            <Route path="*" element={<Auth onLogin={handleLogin} />} />
          ) : (
            /* משתמש מחובר -> עיצוב החדש (Layout) */
            <Route element={<Layout currentUser={currentUser} onLogout={handleLogout} />}>
              
              <Route path="/" element={<Dashboard currentUser={currentUser} />} />
              
              {/* דפים כלליים */}
              <Route path="/vendors" element={<VendorList />} />
              <Route path="/tips" element={<Tips />} />
              <Route path="/settings" element={<Settings currentUser={currentUser} onUpdateUser={handleLogin} />} />

              {/* דפים של אירוע ספציפי */}
              <Route path="/events/:eventId/guests" element={<GuestList currentUser={currentUser} />} />
              <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
              <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
              <Route path="/events/:eventId/seating" element={<SeatingArrangements currentUser={currentUser} />} />
              
              {/* ברירת מחדל */}
              <Route path="*" element={<Navigate to="/" />} />
            </Route>
          )}
        </Routes>
    </Router>
  );
}

export default App;