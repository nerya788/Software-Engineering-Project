import { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  // מצב התחברות
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [currentUser, setCurrentUser] = useState(null); // {id, email, full_name}

  // טפסים
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  const [eventForm, setEventForm] = useState({
    title: '',
    eventDate: '',
    description: '',
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    isDone: false,
  });

  const [message, setMessage] = useState('');

  // --- handlers לטפסים ---
  const handleRegisterChange = (e) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
  };

  const handleLoginChange = (e) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
  };

  const handleEventChange = (e) => {
    setEventForm({ ...eventForm, [e.target.name]: e.target.value });
  };

  const handleTaskChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTaskForm({
      ...taskForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // --- קריאות ל-API ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post('http://localhost:4000/api/users/register', registerForm);
      setMessage(`User registered with id ${res.data.id}. You can now login.`);
      setMode('login');
      setRegisterForm({ email: '', password: '', fullName: '' });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Something went wrong';
      setMessage('Error (register): ' + msg);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post('http://localhost:4000/api/users/login', loginForm);
      setCurrentUser(res.data); // {id, email, full_name}
      setMessage(`Welcome, ${res.data.full_name || res.data.email}!`);
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Something went wrong';
      setMessage('Error (login): ' + msg);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post('http://localhost:4000/api/events', {
        userId: currentUser.id,
        title: eventForm.title,
        eventDate: eventForm.eventDate,
        description: eventForm.description,
      });
      setMessage(`Event created with id ${res.data.id}`);
      setEventForm({ title: '', eventDate: '', description: '' });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Something went wrong';
      setMessage('Error (event): ' + msg);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const res = await axios.post('http://localhost:4000/api/tasks', {
        userId: currentUser.id,
        title: taskForm.title,
        dueDate: taskForm.dueDate || null,
        isDone: taskForm.isDone,
      });
      setMessage(`Task created with id ${res.data.id}`);
      setTaskForm({ title: '', dueDate: '', isDone: false });
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Something went wrong';
      setMessage('Error (task): ' + msg);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setMessage('Logged out.');
  };

  // --- UI למסך Login/Register ---
  if (!currentUser) {
    return (
      <div className="app">
        <header className="app-header">
          <div className="app-header-inner">
            <h1 className="app-title">Wedding Planner</h1>
            {/* אין יותר טקסט על ספרינט */}
            <span className="app-subtitle">Plan & track your wedding easily</span>
          </div>
        </header>

        <main className="app-main">
          <div className="auth-card card">
            <div className="tabs">
              <button
                type="button"
                className={`tab ${mode === 'login' ? 'tab-active' : ''}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`tab ${mode === 'register' ? 'tab-active' : ''}`}
                onClick={() => setMode('register')}
              >
                Register
              </button>
            </div>

            {mode === 'login' && (
              <div>
                <h2 className="card-title">Sign in to your account</h2>
                <form className="form" onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={loginForm.email}
                      onChange={handleLoginChange}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={loginForm.password}
                      onChange={handleLoginChange}
                      placeholder="••••••••"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Login
                  </button>
                </form>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <h2 className="card-title">Create a new account</h2>
                <form className="form" onSubmit={handleRegister}>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
                      placeholder="Choose a password"
                    />
                  </div>

                  <div className="form-group">
                    <label>Full name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={registerForm.fullName}
                      onChange={handleRegisterChange}
                      placeholder="Your full name"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Register
                  </button>
                </form>
              </div>
            )}

            {message && <p className="message">{message}</p>}
          </div>
        </main>
      </div>
    );
  }

  // --- UI למסך אחרי התחברות (Dashboard) ---
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <h1 className="app-title">Wedding Planner</h1>
          <span className="app-subtitle">Dashboard</span>
        </div>
        <div className="user-info">
          <span className="user-name">
            {currentUser.full_name || currentUser.email}
          </span>
          <button className="btn btn-secondary btn-small" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="grid">
          <section className="card">
            <h2 className="card-title">Add Event</h2>
            <p className="card-description">
              Create a new event for this user (for example: wedding date, engagement party, meeting with hall, etc.).
            </p>
            <form className="form" onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={eventForm.title}
                  onChange={handleEventChange}
                  placeholder="Event title"
                />
              </div>

              <div className="form-group">
                <label>Event date</label>
                <input
                  type="date"
                  name="eventDate"
                  value={eventForm.eventDate}
                  onChange={handleEventChange}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={eventForm.description}
                  onChange={handleEventChange}
                  rows={3}
                  placeholder="Short description (optional)"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                Create Event
              </button>
            </form>
          </section>

          <section className="card">
            <h2 className="card-title">Create Task</h2>
            <p className="card-description">
              Add a task for this user (for example: call photographer, check catering prices, send invitations).
            </p>
            <form className="form" onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  value={taskForm.title}
                  onChange={handleTaskChange}
                  placeholder="Task title"
                />
              </div>

              <div className="form-group">
                <label>Due date</label>
                <input
                  type="date"
                  name="dueDate"
                  value={taskForm.dueDate}
                  onChange={handleTaskChange}
                />
              </div>

              <div className="form-group form-group-inline">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isDone"
                    checked={taskForm.isDone}
                    onChange={handleTaskChange}
                  />
                  Task is already done
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                Create Task
              </button>
            </form>
          </section>
        </div>

        {message && <p className="message message-bottom">{message}</p>}
      </main>
    </div>
  );
}

export default App;
