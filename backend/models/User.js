const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, required: true },
    full_name: { type: String },
    
    // --- Partner Feature Fields ---
    
    // For the main couple: Unique code to share with partners (e.g., 'WED-1234')
    wedding_code: { type: String, unique: true, sparse: true }, 

    // For the partner: Flags if this is a limited account
    is_partner: { type: Boolean, default: false },
    
    // For the partner: References the main couple's User ID
    linked_wedding_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // User Settings
    settings: {
      notification_days: { type: Number, default: 1 }
    },
    
    reset_token: String,
    reset_token_expires_at: Date,
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('User', userSchema);