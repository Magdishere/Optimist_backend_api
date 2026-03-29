const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const productSchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please add a product name in English'],
      trim: true
    },
    ar: {
      type: String,
      required: [true, 'Please add a product name in Arabic'],
      trim: true
    }
  },
  slug: String,
  description: {
    en: {
      type: String,
      required: [true, 'Please add an English description']
    },
    ar: {
      type: String,
      required: [true, 'Please add an Arabic description']
    }
  },
  category: {
    type: mongoose.Schema.ObjectId,
    ref: 'Category',
    required: true
  },
  menuSection: {
    type: String,
    default: 'General', // e.g., 'Hot', 'Cold', 'Sweet', 'Savory'
  },
  basePrice: {
    type: Number,
    required: [true, 'Please add a base price']
  },
  // Variants (User MUST pick one, e.g., Small, Medium, Large)
  variants: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ],
  // Add-ons (User CAN pick many, e.g., Extra Nutella, Oat Milk)
  addOns: [
    {
      name: { type: String, required: true },
      price: { type: Number, required: true }
    }
  ],
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  branches: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Location'
    }
  ],
  preparationTime: {
    type: Number, // in minutes
    default: 5
  }
}, { timestamps: true });

productSchema.pre('save', function() {
  if (this.isModified('name.en')) {
    this.slug = slugify(this.name.en);
  }
});

module.exports = mongoose.model('Product', productSchema);