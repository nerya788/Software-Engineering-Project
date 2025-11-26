// backend/models/Task.js
const { mongoose } = require('../db');

const taskSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    due_date: { type: Date },
    is_done: { type: Boolean, default: false, index: true }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Task', taskSchema);
