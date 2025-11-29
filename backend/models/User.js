// backend/models/User.js
const { mongoose } = require('../db');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    
    // --- שדה חדש להגדרות ---
    settings: {
      notification_days: { type: Number, default: 1 } // ברירת מחדל: יום אחד לפני
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('User', userSchema);
