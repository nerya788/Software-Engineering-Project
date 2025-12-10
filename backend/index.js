const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
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

function buildMailTransport() {
  // נסה להשתמש ב-Gmail אם יש פרטי התחברות
  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });
  }
  
  // אם אין פרטי Gmail, נסה להשתמש ב-SMTP כללי
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  
  // fallback transport - מדפיס את הקישור לקונסול במקום לשלוח מייל
  console.warn('⚠️ אין הגדרות מייל - הקישור לאיפוס סיסמה יודפס לקונסול');
  return {
    sendMail: async (opts) => {
      console.log('📧 ============================================');
      console.log('📧 שליחת מייל (מצב פיתוח - אין הגדרות מייל)');
      console.log('📧 אל:', opts.to);
      console.log('📧 נושא:', opts.subject);
      console.log('📧 קישור לאיפוס:', opts.text || opts.html);
      console.log('📧 ============================================');
      // מחזיר אובייקט דמה של הצלחה
      return { messageId: 'dev-mode-' + Date.now() };
    },
  };
}

const mailer = buildMailTransport();

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

// בקשת איפוס סיסמה - יוצר סיסמה חדשה ושולח במייל
app.post('/api/users/forgot', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(200).json({ ok: true }); // לא חושפים קיום
    
    // יצירת סיסמה חדשה אקראית (8 תווים - אותיות ומספרים)
    const generatePassword = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let password = '';
      for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const newPassword = generatePassword();
    
    // עדכון הסיסמה במסד הנתונים
    user.password_hash = newPassword;
    user.reset_token = undefined;
    user.reset_token_expires_at = undefined;
    await user.save();
    
    // הדפסת הסיסמה החדשה לקונסול (למצב פיתוח)
    console.log('\n📧 ============================================');
    console.log('📧 סיסמה חדשה נוצרה');
    console.log('📧 ============================================');
    console.log('📧 משתמש:', user.email);
    console.log('📧 סיסמה חדשה:', newPassword);
    console.log('📧 ============================================\n');
    
    try {
      const mailOptions = {
        from: process.env.GMAIL_USER || process.env.SMTP_USER || 'noreply@weddingplanner.com',
        to: user.email,
        subject: 'סיסמה חדשה - Wedding Planner',
        text: `הסיסמה החדשה שלך היא: ${newPassword}\n\nאנא התחבר עם הסיסמה החדשה ואז שנה אותה בהגדרות.`,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #9333ea; text-align: center;">סיסמה חדשה</h2>
              <p style="color: #333; font-size: 16px;">שלום,</p>
              <p style="color: #333; font-size: 16px;">קיבלנו בקשה לאיפוס הסיסמה שלך. הסיסמה החדשה שלך היא:</p>
              <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f9f9f9; border: 2px solid #9333ea; border-radius: 10px;">
                <p style="color: #9333ea; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 0;">${newPassword}</p>
              </div>
              <p style="color: #333; font-size: 16px; margin-top: 20px;">אנא התחבר עם הסיסמה החדשה ואז שנה אותה בהגדרות לנוחיותך.</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">אם לא ביקשת איפוס סיסמה, אנא צור איתנו קשר מיד.</p>
              <p style="color: #999; font-size: 12px;">לבטחונך, מומלץ לשנות את הסיסמה לאחר ההתחברות.</p>
            </div>
          </div>
        `,
      };
      
      const result = await mailer.sendMail(mailOptions);
      console.log('✅ Email sent successfully to:', user.email);
      if (result && result.messageId) {
        console.log('📧 Message ID:', result.messageId);
      }
    } catch (emailErr) {
      console.error('❌ Error sending email:', emailErr);
      console.error('❌ Error details:', emailErr.message);
      // אם אין הגדרות מייל, זה מצב פיתוח - הסיסמה כבר הודפסה למעלה
      if (!process.env.GMAIL_USER && !process.env.SMTP_USER) {
        console.log('ℹ️ מצב פיתוח - אין הגדרות מייל, הסיסמה מודפסת למעלה');
      }
      // עדיין מחזירים הצלחה כדי לא לחשוף מידע
    }
    
    return res.json({ ok: true, password: (!process.env.GMAIL_USER && !process.env.SMTP_USER) ? newPassword : undefined });
  } catch (err) {
    console.error('Error in forgot password:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// החלפת סיסמה עם טוקן
app.post('/api/users/reset', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ message: 'email, token, newPassword required' });
  }
  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
    reset_token: token,
    reset_token_expires_at: { $gte: new Date() },
  });
  if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
  user.password_hash = newPassword;
  user.reset_token = undefined;
  user.reset_token_expires_at = undefined;
  await user.save();
  return res.json({ ok: true });
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

// החלפת סיסמה מההגדרות (דורש סיסמה נוכחית)
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // בדיקת סיסמה נוכחית
    if (user.password_hash !== currentPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // עדכון סיסמה חדשה
    user.password_hash = newPassword;
    await user.save();
    
    res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error changing password', error: err.message });
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

function syncStatus(taskDoc, payload = {}) {
  const update = { ...payload };
  if (update.is_done === true) update.status = 'done';
  if (update.status === 'done') update.is_done = true;
  if (update.status && update.status !== 'done') update.is_done = false;
  return update;
}

app.post('/api/tasks', async (req, res) => {
  const { userId, title, dueDate, isDone, status, category, assigneeName, assigneeEmail, collaboratorsEmails } = req.body;
  if (!userId || !title) {
    return res.status(400).json({ message: 'userId and title are required' });
  }
  try {
    const task = await Task.create(
      syncStatus(null, {
        user_id: userId,
        title,
        due_date: dueDate ? new Date(dueDate) : null,
        is_done: !!isDone,
        status: status || (isDone ? 'done' : 'todo'),
        category: category || 'general',
        assignee_name: assigneeName || null,
        assignee_email: assigneeEmail || null,
        collaborators_emails: collaboratorsEmails || [],
      })
    );
    // שידור לסנכרון חלונות
    io.to(userId).emit('data_changed');
    res.status(201).json(toPublic(task));
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  const { userId, status, category, excludeDone, overdueOnly } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    const filter = { user_id: userId };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (excludeDone === 'true') {
      filter.is_done = false;
      filter.status = { $ne: 'done' };
    }
    if (overdueOnly === 'true') {
      filter.due_date = { $lt: new Date() };
      filter.is_done = false;
      filter.status = { $ne: 'done' };
    }
    const tasks = await Task.find(filter).sort({ due_date: 1, created_at: -1 });
    res.json(tasks.map(toPublic));
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

// עדכון משימה (כולל סימון הושלמה, שיוך, קטגוריה)
app.put('/api/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { title, dueDate, isDone, status, category, assigneeName, assigneeEmail, collaboratorsEmails } = req.body;
  const update = {};
  if (title !== undefined) update.title = title;
  if (dueDate !== undefined) update.due_date = dueDate ? new Date(dueDate) : null;
  if (isDone !== undefined) update.is_done = !!isDone;
  if (status !== undefined) update.status = status;
  if (category !== undefined) update.category = category;
  if (assigneeName !== undefined) update.assignee_name = assigneeName;
  if (assigneeEmail !== undefined) update.assignee_email = assigneeEmail;
  if (collaboratorsEmails !== undefined) update.collaborators_emails = collaboratorsEmails;

  const finalUpdate = syncStatus(null, update);

  try {
    const updated = await Task.findByIdAndUpdate(id, finalUpdate, { new: true });
    if (!updated) return res.status(404).json({ message: 'Task not found' });
    io.to(String(updated.user_id)).emit('data_changed');
    res.json(toPublic(updated));
  } catch (err) {
    res.status(500).json({ message: 'Error updating task', error: err.message });
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