const mongoose = require('mongoose');
const slugify = require('../utils/slugify');

const categorySchema = new mongoose.Schema({
  name: {
    en: {
      type: String,
      required: [true, 'Please add a category name in English'],
      trim: true
    },
    ar: {
      type: String,
      required: [true, 'Please add a category name in Arabic'],
      trim: true
    }
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
  },
  branches: [
    {
      type: mongoose.Schema.ObjectId,
      ref: 'Location'
    }
  ]
}, { timestamps: true });

categorySchema.pre('save', function() {
  if (this.isModified('name.en')) {
    this.slug = slugify(this.name.en);
  }
});

module.exports = mongoose.model('Category', categorySchema);