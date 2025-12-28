import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// רכיבים
import Auth from './components/Auth'; // הייבוא החדש שלנו
import ThemeToggle from './components/ThemeToggle'; // כפתור החלפת הנושא
import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';
import Settings from './components/Settings';
import BudgetDashboard from './components/BudgetDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (userData) => {
    setCurrentUser(userData);
    // אופציונלי: כאן תוכל לשמור ל-localStorage אם תרצה שההתחברות תשמר בריענון
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

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
                <Route path="/events/:eventId/guests" element={<GuestList />} />
                <Route path="/events/:eventId/budget" element={<BudgetDashboard currentUser={currentUser} />} />
                <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
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