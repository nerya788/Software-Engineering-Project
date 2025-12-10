// backend/models/User.js
const { mongoose } = require('../db');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    
    // שחזור סיסמה בסיסי
    reset_token: { type: String },
    reset_token_expires_at: { type: Date },

    // --- שדה חדש להגדרות ---
    settings: {
      notification_days: { type: Number, default: 1 } // ברירת מחדל: יום אחד לפני
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('User', userSchema);
