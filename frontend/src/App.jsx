import { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import Dashboard from './components/Dashboard';
import GuestList from './components/GuestList';
import EditEventForm from './components/EditEventForm';

function App() {
  const [mode, setMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);
  
  const [registerForm, setRegisterForm] = useState({ email: '', password: '', fullName: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  const handleRegisterChange = (e) => setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  const handleLoginChange = (e) => setLoginForm({ ...loginForm, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/users/register', registerForm);
      setMessage(`User registered! Please login.`);
      setMode('login');
      setRegisterForm({ email: '', password: '', fullName: '' });
    } catch (err) {
      setMessage('Error register: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:4000/api/users/login', loginForm);
      setCurrentUser(res.data);
      setMessage('');
    } catch (err) {
      setMessage('Error login: ' + (err.response?.data?.message || 'Error'));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMode('login');
  };


  if (!currentUser) {
    return (
      <div className="app flex items-center justify-center min-h-screen bg-gray-100">
        <div className="auth-card card w-full max-w-md p-6 bg-white shadow-lg rounded-lg">
          <h1 className="text-3xl font-bold text-center text-purple-600 mb-2">Wedding Planner</h1>
          
          <div className="tabs flex justify-center gap-4 mb-6 border-b pb-2">
            <button className={`pb-1 ${mode === 'login' ? 'border-b-2 border-purple-600 font-bold' : ''}`} onClick={() => setMode('login')}>Login</button>
            <button className={`pb-1 ${mode === 'register' ? 'border-b-2 border-purple-600 font-bold' : ''}`} onClick={() => setMode('register')}>Register</button>
          </div>

          {mode === 'login' ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <input className="w-full p-2 border rounded" type="email" name="email" placeholder="Email" value={loginForm.email} onChange={handleLoginChange} required />
              <input className="w-full p-2 border rounded" type="password" name="password" placeholder="Password" value={loginForm.password} onChange={handleLoginChange} required />
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Login</button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <input className="w-full p-2 border rounded" type="text" name="fullName" placeholder="Full Name" value={registerForm.fullName} onChange={handleRegisterChange} />
              <input className="w-full p-2 border rounded" type="email" name="email" placeholder="Email" value={registerForm.email} onChange={handleRegisterChange} required />
              <input className="w-full p-2 border rounded" type="password" name="password" placeholder="Password" value={registerForm.password} onChange={handleRegisterChange} required />
              <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700">Register</button>
            </form>
          )}
          
          {message && <p className="mt-4 text-center text-red-500">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* נתיב ראשי: הדשבורד החדש שיצרנו */}
        <Route path="/" element={<Dashboard currentUser={currentUser} onLogout={handleLogout} />} />
        
        {/* נתיב לרשימת המוזמנים: מקבל eventId מה-URL */}
        <Route path="/events/:eventId/guests" element={<GuestList />} />

    
        <Route path="/events/:eventId/edit" element={<EditEventForm currentUser={currentUser} />} />
        
        {/* כל נתיב אחר יחזיר לדף הבית */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;