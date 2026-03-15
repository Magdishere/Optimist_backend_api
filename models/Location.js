const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a location name'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Please add an address']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number']
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Please add latitude']
    },
    lng: {
      type: Number,
      required: [true, 'Please add longitude']
    }
  },
  services: {
    dineIn: {
      type: Boolean,
      default: false
    },
    pickup: {
      type: Boolean,
      default: false
    },
    delivery: {
      type: Boolean,
      default: false
    }
  },
  operatingHours: {
    monday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    tuesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    wednesday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    thursday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    friday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    saturday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    },
    sunday: {
      open: String,
      close: String,
      isClosed: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);
