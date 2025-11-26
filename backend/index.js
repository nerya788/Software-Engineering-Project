require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// בדיקת חיבור לשרת ול-DB
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', error: err.message });
  }
});

// --- User Story 1: Register ---
app.post('/api/users/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const sql = `
      INSERT INTO users (email, password_hash, full_name)
      VALUES ($1, $2, $3)
      RETURNING id, email, full_name, created_at;
    `;
    // שים לב: בשלב הזה אנחנו שומרים סיסמה כטקסט רגיל,
    // בפרויקט אמיתי צריך להשתמש ב-hash (bcrypt וכד').
    const params = [email, password, fullName || null];
    const result = await pool.query(sql, params);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    // למשל מייל כפול – יחזיר שגיאה מה-DB
    res.status(500).json({ message: 'Error registering user', error: err.message });
  }
});

// --- User Story 1: Login ---
app.post('/api/users/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const sql = `
      SELECT id, email, full_name, created_at
      FROM users
      WHERE email = $1 AND password_hash = $2
      LIMIT 1;
    `;
    const params = [email, password];
    const result = await pool.query(sql, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // כאן אפשר היה ליצור JWT וכו', אבל לספרינט מספיק להחזיר את פרטי המשתמש
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error logging in', error: err.message });
  }
});

// --- User Story 2: Add Event ---
app.post('/api/events', async (req, res) => {
  const { userId, title, eventDate, description } = req.body;

  if (!userId || !title || !eventDate) {
    return res.status(400).json({ message: 'userId, title and eventDate are required' });
  }

  try {
    const sql = `
      INSERT INTO events (user_id, title, event_date, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, title, event_date, description, created_at;
    `;
    const params = [userId, title, eventDate, description || null];
    const result = await pool.query(sql, params);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating event', error: err.message });
  }
});

// --- User Story 3: Create Task ---
app.post('/api/tasks', async (req, res) => {
  const { userId, title, dueDate, isDone } = req.body;

  if (!userId || !title) {
    return res.status(400).json({ message: 'userId and title are required' });
  }

  try {
    const sql = `
      INSERT INTO tasks (user_id, title, due_date, is_done)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, title, due_date, is_done, created_at;
    `;
    const params = [userId, title, dueDate || null, isDone ?? false];
    const result = await pool.query(sql, params);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
