const Category = require('../models/Category');
const imagekit = require('../config/imagekit');

// Helper to upload image to ImageKit
const uploadToImageKit = async (file) => {
  try {
    const result = await imagekit.files.upload({
      file: file.buffer.toString("base64"), // required
      fileName: `category-${Date.now()}`, // required
      folder: '/categories'
    });
    return result.url;
  } catch (error) {
    throw new Error(`ImageKit Upload Error: ${error.message}`);
  }
};

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
exports.getCategories = async (req, res) => {
  try {
    const query = {};
    if (req.query.branch) {
      query.branches = { $in: [req.query.branch] };
    }
    const categories = await Category.find(query).sort('displayOrder');
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single category
// @route   GET /api/categories/:id
// @access  Public
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create category
// @route   POST /api/categories
// @access  Private/Admin
exports.createCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    if (typeof categoryData.branches === 'string') categoryData.branches = JSON.parse(categoryData.branches);
    
    if (req.file) {
      categoryData.image = await uploadToImageKit(req.file);
    }
    const category = await Category.create(categoryData);
    res.status(201).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
exports.updateCategory = async (req, res) => {
  try {
    const categoryData = { ...req.body };
    if (typeof categoryData.branches === 'string') categoryData.branches = JSON.parse(categoryData.branches);

    if (req.file) {
      categoryData.image = await uploadToImageKit(req.file);
    }
    const category = await Category.findByIdAndUpdate(req.params.id, categoryData, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: category });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};