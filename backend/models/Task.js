// backend/models/Task.js
const { mongoose } = require('../db');

const taskSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    // יעדי זמן
    due_date: { type: Date },
    // מצב משימה (שומר תאימות עם is_done)
    is_done: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo', index: true },
    // שיוך/האצלה
    assignee_name: { type: String },
    assignee_email: { type: String },
    // קטגוריה בסיסית
    category: { type: String, default: 'general', index: true },
    // שיתופים במייל (פשוט, ללא הרשאות מורכבות)
    collaborators_emails: [{ type: String }]
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Task', taskSchema);
