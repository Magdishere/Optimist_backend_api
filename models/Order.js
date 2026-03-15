const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [
    {
      product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: true
      },
      name: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      variant: {
        name: String,
        price: Number
      },
      selectedAddOns: [
        {
          name: String,
          price: Number
        }
      ],
      priceAtPurchase: { type: Number, required: true }
    }
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0.0
  },
  tax: {
    type: Number,
    required: true,
    default: 0.0
  },
  deliveryFee: {
    type: Number,
    required: true,
    default: 0.0
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  status: {
    type: String,
    enum: [
      'pending', 
      'awaiting_payment', 
      'paid', 
      'confirmed', 
      'preparing', 
      'ready', 
      'delivering', 
      'delivered', 
      'cancelled'
    ],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['online', 'cod'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cash_on_delivery', 'refunded'],
    default: 'pending'
  },
  orderType: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  shippingAddress: {
    street: String,
    city: String,
    phone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  transactionId: String,
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: Date,
  estimatedTime: Number, // in minutes
  orderHistory: [
    {
      status: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      note: String
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);