const express = require('express');
const { createPaymentIntent, stripeWebhook } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Webhook must be Public (not protected)
router.post('/webhook', express.json({type: 'application/json'}), stripeWebhook);

// Protected routes
router.use(protect);
router.post('/create-intent/:orderId', createPaymentIntent);
router.post('/confirm/:orderId', require('../controllers/paymentController').confirmPayment);

module.exports = router;