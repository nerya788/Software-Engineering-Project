// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { connectMongo } = require('./db');
const User = require('./models/User');
const Event = require('./models/Event');
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS פתוח לפיתוח
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.set('trust proxy', 1);

// Helper: להחזיר id כמחרוזת במקום _id
function toPublic(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : doc;
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  return o;
}

// ---- Health routes (לניטור מהיר) ----
const healthHandler = (req, res) => {
  res.status(200).json({
    ok: true,
    db: mongoose.connection?.name || null,
    state: mongoose.connection?.readyState ?? null, // 1=connected
    uptime: process.uptime(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// --- Users: exists (בדיקה מהירה אם מייל קיים) ---
app.get('/api/users/exists', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'email is required' });
    const exists = await User.exists({ email });
    return res.json({ email, exists: !!exists });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'server error', error: err.message });
  }
});

// --- Register ---
app.post('/api/users/register', async (req, res) => {
  let { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  email = String(email).toLowerCase().trim();
  try {
    const user = await User.create({
      email,
      password_hash: password, // בשלב זה ללא הצפנה
      full_name: fullName || null,
    });
    res.status(201).json(toPublic(user));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    console.error(err);
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// --- Login ---
app.post('/api/users/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  email = String(email).toLowerCase().trim();
  try {
    const user = await User.findOne({ email, password_hash: password }).lean();
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    user.id = String(user._id);
    delete user._id;
    delete user.__v;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// --- Add Event ---
app.post('/api/events', async (req, res) => {
  const { userId, title, eventDate, description } = req.body;
  if (!userId || !title || !eventDate) {
    return res.status(400).json({ message: 'userId, title and eventDate are required' });
  }
  try {
    const ev = await Event.create({
      user_id: userId,
      title,
      event_date: new Date(eventDate),
      description: description || null,
    });
    res.status(201).json(toPublic(ev));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// --- Create Task ---
app.post('/api/tasks', async (req, res) => {
  const { userId, title, dueDate, isDone } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ message: 'userId and title are required' });
  }
  try {
    const task = await Task.create({
      user_id: userId,
      title,
      due_date: dueDate ? new Date(dueDate) : null,
      is_done: !!isDone,
    });
    res.status(201).json(toPublic(task));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

// הפעלה אחרי התחברות למונגו
connectMongo()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend (Mongo) listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect Mongo:', err.message);
    process.exit(1);
  });
