const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  // ✅ תיקון: שינינו מ-event_id ל-eventId
  eventId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false // השארנו false כדי למנוע את הקריסה הקודמת
  },
  name: { 
    type: String, 
    required: true 
  },
  capacity: { 
    type: Number, 
    default: 10 
  }
}, { timestamps: true });

// המרה של _id ל-id בשביל הפרונט
tableSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Table', tableSchema);