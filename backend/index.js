// backend/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { connectMongo } = require('./db');
const User = require('./models/User');
const Event = require('./models/Event');
const Task = require('./models/Task');
const Guest = require('./models/Guest');

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

// --- Get Events for User ---
// שימוש: GET /api/events?userId=...
app.get('/api/events', async (req, res) => {
  const { userId } = req.query;
  
  if (!userId) {
    return res.status(400).json({ message: 'userId query param is required' });
  }

  try {
    // שליפת אירועים ששייכים למשתמש הזה בלבד
    const events = await Event.find({ user_id: userId }).sort({ event_date: 1 });
    res.json(events.map(toPublic));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching events', error: err.message });
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

// --- Get Tasks for User ---
// שימוש: GET /api/tasks?userId=...
app.get('/api/tasks', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    // שולפים את כל המשימות של המשתמש
    const tasks = await Task.find({ user_id: userId }).sort({ due_date: 1 });
    res.json(tasks.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// --- Get Guests for an Event ---
// שימוש: GET /api/events/:eventId/guests
app.get('/api/events/:eventId/guests', async (req, res) => {
  const { eventId } = req.params;
  try {
    // שליפת כל המוזמנים ששייכים לאירוע הספציפי הזה
    const guests = await Guest.find({ event_id: eventId }).sort({ created_at: -1 });
    // המרת כל מוזמן לפורמט Public (עם id רגיל)
    const publicGuests = guests.map(toPublic);
    res.json(publicGuests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching guests', error: err.message });
  }
});

// --- Add Guest ---
// שימוש: POST /api/guests
app.post('/api/guests', async (req, res) => {
  const { eventId, fullName, email, phone, amountInvited } = req.body;
  
  if (!eventId || !fullName) {
    return res.status(400).json({ message: 'eventId and fullName are required' });
  }

  try {
    const newGuest = await Guest.create({
      event_id: eventId,
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      amount_invited: amountInvited || 1,
      rsvp_status: 'pending' // ברירת מחדל
    });
    res.status(201).json(toPublic(newGuest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding guest', error: err.message });
  }
});

// --- Update Guest RSVP / Details ---
// שימוש: PUT /api/guests/:id
app.put('/api/guests/:id', async (req, res) => {
  const { id } = req.params;
  const { rsvpStatus, amountInvited, fullName } = req.body; // אפשר לעדכן סטטוס, כמות, או שם

  try {
    const updateData = {};
    if (rsvpStatus) updateData.rsvp_status = rsvpStatus;
    if (amountInvited) updateData.amount_invited = amountInvited;
    if (fullName) updateData.full_name = fullName;

    const updatedGuest = await Guest.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedGuest) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    
    res.json(toPublic(updatedGuest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating guest', error: err.message });
  }
});

// --- Delete Guest ---
// שימוש: DELETE /api/guests/:id
app.delete('/api/guests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Guest.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Guest not found' });
    }
    res.json({ message: 'Guest deleted successfully', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting guest', error: err.message });
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
