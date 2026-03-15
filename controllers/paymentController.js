const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');

// @desc    Create Stripe Payment Intent
// @route   POST /api/payments/create-intent/:orderId
// @access  Private
exports.createPaymentIntent = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Create a PaymentIntent with the order amount and currency
    // Stripe expects amount in cents
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'usd', // Update this based on your currency
      metadata: { 
        orderId: order._id.toString(),
        userId: req.user.id.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Stripe Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Confirm Payment (Direct from Frontend)
// @route   POST /api/payments/confirm/:orderId
// @access  Private
exports.confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = 'paid';
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentStatus = 'paid';
    if (transactionId) order.transactionId = transactionId;
    
    order.orderHistory.push({
      status: 'paid',
      note: `Payment confirmed directly from frontend (ID: ${transactionId || 'N/A'})`
    });

    await order.save();

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Stripe Webhook
// @route   POST /api/payments/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // In production, verify the webhook signature
    // event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // For now, we'll use the unverified body for development
    event = req.body;
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;

    const order = await Order.findById(orderId);
    if (order) {
      order.status = 'paid';
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentStatus = 'paid';
      order.transactionId = paymentIntent.id;
      order.orderHistory.push({
        status: 'paid',
        note: `Payment confirmed via Stripe (Intent: ${paymentIntent.id})`
      });
      await order.save();
      console.log(`Order ${orderId} marked as paid.`);
    }
  }

  res.status(200).json({ received: true });
};