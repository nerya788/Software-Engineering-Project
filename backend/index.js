// backend/index.js
require('dotenv').config();
require('./scheduler');
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
app.get('/api/events', async (req, res) => {
  const { userId, start, end } = req.query; // הוספנו תמיכה ב-start ו-end
  
  if (!userId) {
    return res.status(400).json({ message: 'userId query param is required' });
  }

  try {
    const filter = { user_id: userId };
    
    // אם נשלחו תאריכים, נסנן לפיהם
    if (start && end) {
      filter.event_date = {
        $gte: new Date(start), // גדול או שווה לתאריך התחלה
        $lte: new Date(end)    // קטן או שווה לתאריך סיום
      };
    }

    const events = await Event.find(filter).sort({ event_date: 1 });
    res.json(events.map(toPublic));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching events', error: err.message });
  }
});


// --- Get Single Event --- 
app.get('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // שליפת האירוע לפי ה-ID
    const event = await Event.findById(id); 
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // מחזירים את האובייקט בפורמט הציבורי (עם 'id' במקום '_id')
    res.json(toPublic(event));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
});


// --- Update Event ---
app.put('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  const { title, eventDate, description } = req.body; // userId לא צריך להשתנות

  try {
    const updateData = {};
    // בודקים אילו שדות נשלחו ומכינים את הנתונים לעדכון (Map from camelCase to snake_case)
    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.event_date = new Date(eventDate);
    if (description !== undefined) updateData.description = description;

    // אופציה: להוסיף בדיקה מינימלית אם אין שדות לעדכון
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No fields provided for update' });
    }

    // מבצעים עדכון ב-MongoDB, ה-`{ new: true }` מחזיר את המסמך המעודכן
    const updated = await Event.findByIdAndUpdate(id, updateData, { new: true });

    if (!updated) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // מחזירים את האובייקט המעודכן בפורמט הציבורי
    res.json(toPublic(updated));
  } catch (err) {
    console.error(err);
    // אם ה-ID לא תקין או יש שגיאת DB אחרת
    res.status(500).json({ message: 'Error updating event', error: err.message });
  }
});

// --- Delete Event ---
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Event.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully', id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting event', error: err.message });
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

// ======================================================
//                 GUEST ROUTES (החלק החשוב)
// ======================================================

// --- Get Guests for an Event ---
app.get('/api/events/:eventId/guests', async (req, res) => {
  const { eventId } = req.params;
  try {
    const guests = await Guest.find({ event_id: eventId }).sort({ created_at: -1 });
    res.json(guests.map(toPublic));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching guests', error: err.message });
  }
});

// --- Add Guest (POST) ---
app.post('/api/guests', async (req, res) => {
  const { 
    eventId, fullName, email, phone, side, 
    amountInvited, mealOption, dietaryNotes, 
    rsvpStatus // מקבלים מהפרונט ב-camelCase
  } = req.body;

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
      rsvp_status: rsvpStatus || 'pending' // המרה ל-snake_case של ה-DB
    });
    res.status(201).json(toPublic(newGuest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error adding guest' });
  }
});

// --- Update Guest (PUT) ---
app.put('/api/guests/:id', async (req, res) => {
  const { id } = req.params;
  
  // כאן אנחנו מפרקים את ה-Body כדי למפות את השדות נכון
  const { 
    fullName, email, phone, side, 
    amountInvited, mealOption, dietaryNotes, 
    rsvpStatus // הנה הבעיה שהייתה לך! הפרונט שולח את זה
  } = req.body;

  try {
    const updateData = {};
    
    // מעדכנים רק מה שנשלח
    if (fullName !== undefined) updateData.full_name = fullName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (side !== undefined) updateData.side = side;
    if (amountInvited !== undefined) updateData.amount_invited = amountInvited;
    if (mealOption !== undefined) updateData.meal_option = mealOption;
    if (dietaryNotes !== undefined) updateData.dietary_notes = dietaryNotes;
    
    // --- התיקון הקריטי: מיפוי rsvpStatus ל-rsvp_status ---
    if (rsvpStatus !== undefined) updateData.rsvp_status = rsvpStatus;

    const updated = await Guest.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updated) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    res.json(toPublic(updated));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating guest' });
  }
});

// --- Delete Guest ---
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

// ======================================================
//                NOTIFICATIONS ROUTES
// ======================================================

// --- Get Notifications (רק את אלו שלא נקראו) ---
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  
  try {
    // מביא התראות שלא נקראו, החדשות ביותר בהתחלה
    const notifications = await Notification.find({ user_id: userId, is_read: false })
      .sort({ created_at: -1 });
    res.json(notifications.map(toPublic));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// --- Mark Notification as Read (עדכון ל"נקרא") ---
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { is_read: true });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating notification' });
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