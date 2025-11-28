// backend/models/Guest.js
const { mongoose } = require('../db');

const guestSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    full_name: { type: String, required: true },
    email: { type: String }, // אופציונלי - לשליחת הזמנות
    phone: { type: String }, // אופציונלי
    amount_invited: { type: Number, default: 1 }, // כמה אנשים בהזמנה הזו
    rsvp_status: { 
      type: String, 
      enum: ['pending', 'attending', 'declined'], 
      default: 'pending' 
    }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Guest', guestSchema);