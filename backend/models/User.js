// backend/models/User.js
const { mongoose } = require('../db');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    
    reset_token: { type: String },
    reset_token_expires_at: { type: Date },

    settings: {
      notification_days: { type: Number, default: 1 },
      theme: { type: String, default: 'light' } 
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('User', userSchema);