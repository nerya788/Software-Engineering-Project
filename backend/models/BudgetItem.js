const { mongoose } = require('../db');

const BudgetItemSchema = new mongoose.Schema({
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  title: { type: String, required: true },
  vendor: { type: String, default: '' }, // שדה חדש: שם הספק
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['אולם וקייטרינג', 'צילום', 'מוזיקה', 'ביגוד וטיפוח', 'עיצוב', 'מתנות', 'טקסים', 'כללי', 'אחר'],
    default: 'אחר'
  },
  is_paid: { type: Boolean, default: false },
  notes: { type: String, default: '' }, // שדה חדש: הערות
  due_date: { type: Date }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('BudgetItem', BudgetItemSchema);