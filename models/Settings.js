const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  usdToLbpRate: {
    type: Number,
    required: true,
    default: 89500 // Current default market rate
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);