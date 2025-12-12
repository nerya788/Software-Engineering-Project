const { mongoose } = require('../db');

const eventSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    event_date: { type: Date, required: true, index: true },
    description: { type: String },
    total_budget: { type: Number, default: 0 },
    is_main_event: { type: Boolean, default: false } 
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Event', eventSchema);