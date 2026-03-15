const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a category name'],
    unique: true,
    trim: true
  },
  slug: String,
  description: String,
  image: {
    type: String,
    default: 'no-photo.jpg'
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

categorySchema.pre('save', function() {
  if (this.isModified('name')) {
    this.slug = slugify(this.name);
  }
});

module.exports = mongoose.model('Category', categorySchema);