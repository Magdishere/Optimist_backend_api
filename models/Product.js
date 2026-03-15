const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    unique: true,
    trim: true
  },
  slug: String,
  description: {
    type: String,
    required: [true, 'Please add a description']
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
  preparationTime: {
    type: Number, // in minutes
    default: 5
  }
}, { timestamps: true });

productSchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('Product', productSchema);