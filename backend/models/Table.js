const { mongoose } = require('../db');

/**
 * Table Schema
 * Represents a seating table within a specific event.
 */
const tableSchema = new mongoose.Schema(
  {
    event_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    name: { type: String, required: true }, // e.g., "Table 1", "VIP Family"
    capacity: { type: Number, default: 10 }, // Maximum guests allowed
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.model('Table', tableSchema);