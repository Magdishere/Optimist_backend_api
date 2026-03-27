const express = require('express');
const { 
  createOrder, 
  getUserOrders, 
  getOrderById, 
  getAllOrders, 
  updateOrderStatus, 
  archiveOrder,
  cancelOrder,
  getInvoice 
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // Protect all order routes

router.route('/')
  .get(authorize('admin'), getAllOrders)
  .post(createOrder);

router.get('/my-orders', getUserOrders);
router.get('/:id/invoice', getInvoice);

router.route('/:id')
  .get(getOrderById);

router.put('/:id/status', authorize('admin'), updateOrderStatus);
router.put('/:id/archive', authorize('admin'), archiveOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
