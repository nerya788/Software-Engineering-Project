const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },     // שדה חובה
  category: { type: String, required: true }, // שדה חובה
  
  // שדות אופציונליים (ללא required)
  phone: { type: String },
  email: { type: String },
  priceEstimate: { type: Number },
  notes: { type: String },
  
  rating: { type: Number, default: 0, min: 0, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);