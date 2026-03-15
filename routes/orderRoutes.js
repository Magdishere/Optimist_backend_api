const express = require('express');
const { createOrder, getUserOrders, getOrderById, getAllOrders, updateOrderStatus, cancelOrder } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all order routes

router.route('/')
  .get(authorize('admin'), getAllOrders)
  .post(createOrder);

router.get('/my-orders', getUserOrders);

router.route('/:id')
  .get(getOrderById);

router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/cancel', cancelOrder);

module.exports = router;