const express = require('express');
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getTopProducts } = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, authorize('admin'), upload.single('image'), createProduct);

router.get('/top', getTopProducts);

router.route('/:id')
  .get(getProduct)
  .put(protect, authorize('admin'), upload.single('image'), updateProduct)
  .delete(protect, authorize('admin'), deleteProduct);

module.exports = router;