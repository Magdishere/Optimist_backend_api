const Product = require('../models/Product');
const imagekit = require('../config/imagekit');

// Helper to upload image to ImageKit
const uploadToImageKit = async (file) => {
  try {
    const result = await imagekit.files.upload({
      file: file.buffer.toString("base64"), // required
      fileName: `product-${Date.now()}`, // required
      folder: '/products'
    });
    return result.url;
  } catch (error) {
    throw new Error(`ImageKit Upload Error: ${error.message}`);
  }
};

// @desc    Get top 3 most ordered products
// @route   GET /api/products/top
// @access  Public
exports.getTopProducts = async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    const topProducts = await Order.aggregate([
      { $match: { isPaid: true, status: { $ne: 'cancelled' } } },
      { $unwind: '$orderItems' },
      {
        $group: {
          _id: '$orderItems.product',
          totalSold: { $sum: '$orderItems.quantity' }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 3 }
    ]);

    const productIds = topProducts.map(p => p._id);
    const products = await Product.find({ _id: { $in: productIds } }).populate('category');

    // Sort products based on the order of productIds (which is sorted by totalSold)
    const sortedProducts = productIds.map(id => products.find(p => p._id.toString() === id.toString())).filter(p => p !== undefined);

    res.status(200).json({ success: true, data: sortedProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const query = {};
    if (req.query.branch) {
      query.branches = { $in: [req.query.branch] };
    }
    const products = await Product.find(query).populate('category');
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const productData = { ...req.body };
    
    // Parse JSON strings from FormData
    if (typeof productData.variants === 'string') productData.variants = JSON.parse(productData.variants);
    if (typeof productData.addOns === 'string') productData.addOns = JSON.parse(productData.addOns);
    if (typeof productData.branches === 'string') productData.branches = JSON.parse(productData.branches);

    if (req.file) {
      console.log('File detected for product, uploading to ImageKit...');
      productData.image = await uploadToImageKit(req.file);
      console.log('Image uploaded successfully:', productData.image);
    } else {
      console.log('No file detected for product creation');
    }

    const product = await Product.create(productData);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('Product Creation Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
  try {
    const productData = { ...req.body };

    if (typeof productData.variants === 'string') productData.variants = JSON.parse(productData.variants);
    if (typeof productData.addOns === 'string') productData.addOns = JSON.parse(productData.addOns);
    if (typeof productData.branches === 'string') productData.branches = JSON.parse(productData.branches);

    if (req.file) {
      console.log('File detected for product update, uploading to ImageKit...');
      productData.image = await uploadToImageKit(req.file);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error('Product Update Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};