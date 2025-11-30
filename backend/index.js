const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const { connectMongo } = require('./db');
const User = require('./models/User');
const Event = require('./models/Event');
const Task = require('./models/Task');
const Guest = require('./models/Guest');
const Notification = require('./models/Notification');

const app = express();
const PORT = process.env.PORT || 4000;

// 1. יצירת שרת HTTP ועטיפת האפליקציה של Express
const server = http.createServer(app);

// 2. חיבור Socket.io לשרת
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"], // הרשאות ל-Frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ייצוא אובייקט ה-io (למקרה שנצטרך אותו בקבצים אחרים)
module.exports.io = io;

// CORS & Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.set('trust proxy', 1);

// Helper function
function toPublic(doc) {
  if (!doc) return doc;
  const o = doc.toObject ? doc.toObject() : doc;
  o.id = String(o._id);
  delete o._id;
  delete o.__v;
  return o;
}

// Socket.io - טיפול בחיבורים
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // הרשמת המשתמש ל"חדר" שלו
  socket.on('register_user', (userId) => {
    socket.join(userId);
    console.log(`   --> User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// --- הפעלת ה-Scheduler עם ה-IO (עבור התראות) ---
require('./scheduler')(io); 


// ================= ROUTES =================

const healthHandler = (req, res) => {
  res.status(200).json({
    ok: true,
    db: mongoose.connection?.name || null,
    state: mongoose.connection?.readyState ?? null,
    uptime: process.uptime(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// --- Auth Routes ---

app.get('/api/users/exists', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'email is required' });
    const exists = await User.exists({ email });
    return res.json({ email, exists: !!exists });
  } catch (err) {
    return res.status(500).json({ message: 'server error', error: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  let { email, password, fullName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }
  email = String(email).toLowerCase().trim();
  try {
    const user = await User.create({
      email,
      password_hash: password,
      full_name: fullName || null,
    });
    res.status(201).json(toPublic(user));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

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
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

app.put('/api/users/:id/settings', async (req, res) => {
  const { id } = req.params;
  const { notificationDays } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { 'settings.notification_days': notificationDays },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(toPublic(user));
  } catch (err) {
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// --- Event Routes ---

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
    // שידור לסנכרון חלונות
    io.to(userId).emit('data_changed');
    res.status(201).json(toPublic(ev));
  } catch (err) {
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

app.get('/api/events', async (req, res) => {
  const { userId, start, end } = req.query;
  if (!userId) {
    return res.status(400).json({ message: 'userId query param is required' });
  }
  try {
    const filter = { user_id: userId };
    if (start && end) {
      filter.event_date = {
        $gte: new Date(start),
        $lte: new Date(end)
      };
    }
    const events = await Event.find(filter).sort({ event_date: 1 });
    res.json(events.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});

app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(toPublic(event));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { title, eventDate, description } = req.body;
  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.event_date = new Date(eventDate);
    if (description !== undefined) updateData.description = description;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    const updated = await Event.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Event not found' });

    // שידור לסנכרון חלונות (משתמשים ב-UserID של האירוע המעודכן)
    io.to(String(updated.user_id)).emit('data_changed');
    res.json(toPublic(updated));
  } catch (err) {
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Event not found' });
    
    // שידור לסנכרון חלונות
    io.to(String(deleted.user_id)).emit('data_changed');
    res.json({ message: 'Event deleted successfully', id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event', error: err.message });
  }
});

// --- Task Routes ---

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
    // שידור לסנכרון חלונות
    io.to(userId).emit('data_changed');
    res.status(201).json(toPublic(task));
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const tasks = await Task.find({ user_id: userId }).sort({ due_date: 1 });
    res.json(tasks.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// --- Guest Routes ---

app.get('/api/events/:eventId/guests', async (req, res) => {
  const { eventId } = req.params;
  try {
    const guests = await Guest.find({ event_id: eventId }).sort({ created_at: -1 });
    res.json(guests.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching guests', error: err.message });
  }
});

app.post('/api/guests', async (req, res) => {
  const { eventId, fullName, email, phone, side, amountInvited, mealOption, dietaryNotes, rsvpStatus } = req.body;
  try {
    const newGuest = await Guest.create({
      event_id: eventId,
      full_name: fullName,
      email,
      phone,
      side: side || 'friend',
      amount_invited: amountInvited,
      meal_option: mealOption || 'standard',
      dietary_notes: dietaryNotes,
      rsvp_status: rsvpStatus || 'pending'
    });
    res.status(201).json(toPublic(newGuest));
  } catch (err) {
    res.status(500).json({ message: 'Error adding guest' });
  }
});

app.put('/api/guests/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, email, phone, side, amountInvited, mealOption, dietaryNotes, rsvpStatus } = req.body;
  try {
    const updateData = {};
    if (fullName !== undefined) updateData.full_name = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (side !== undefined) updateData.side = side;
    if (amountInvited !== undefined) updateData.amount_invited = amountInvited;
    if (mealOption !== undefined) updateData.meal_option = mealOption;
    if (dietaryNotes !== undefined) updateData.dietary_notes = dietaryNotes;
    if (rsvpStatus !== undefined) updateData.rsvp_status = rsvpStatus;

    const updated = await Guest.findByIdAndUpdate(id, updateData, { new: true });
    if (!updated) return res.status(404).json({ message: 'Guest not found' });
    res.json(toPublic(updated));
  } catch (err) {
    res.status(500).json({ message: 'Error updating guest' });
  }
});

app.delete('/api/guests/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Guest.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Guest not found' });
    res.json({ message: 'Guest deleted successfully', id });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting guest', error: err.message });
  }
});

// --- Notification Routes ---

app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const notifications = await Notification.find({ user_id: userId, is_read: false })
      .sort({ created_at: -1 });
    res.json(notifications.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// --- Server Start ---

connectMongo()
  .then(() => {
    // שימוש ב-server.listen במקום app.listen
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend (Socket.io/Mongo) listening on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect Mongo:', err.message);
    process.exit(1);
  });