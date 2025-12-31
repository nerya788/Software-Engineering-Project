const { mongoose } = require('../db');

const guestSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    full_name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    side: { type: String, enum: ['bride', 'groom', 'friend', 'family'], default: 'friend' },
    amount_invited: { type: Number, default: 1 },

    // standard = רגילה, special = מיוחדת (השאר נשמר לתאימות אם כבר השתמשת בזה)
    meal_option: { type: String, default: 'standard' }, // standard, special, veggie, vegan, kids

    dietary_notes: { type: String }, // הערות חופשיות (אלרגיות וכו')

    rsvp_status: { 
      type: String, 
      enum: ['pending', 'attending', 'declined'], 
      default: 'pending' 
    },

    // ✅ חדש: אורח שנוצר דרך עמוד ה-RSVP עם טלפון שלא זוהה
    is_unknown: { type: Boolean, default: false }
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } } // זה מטפל ב-Updated_at timestamp שביקשת
);

module.exports = mongoose.model('Guest', guestSchema);
