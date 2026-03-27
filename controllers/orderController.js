const Order = require('../models/Order');
const Product = require('../models/Product');
const generateInvoice = require('../utils/invoiceGenerator');
const notificationService = require('../utils/notificationService');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Download order invoice as PDF
// @route   GET /api/orders/:id/invoice
exports.getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'firstName lastName')
      .populate('branch');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const filename = `invoice-${order._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    generateInvoice(order, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const { 
      orderItems, 
      branch,
      deliveryFee, 
      paymentMethod, 
      orderType, 
      shippingAddress 
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    if (!branch) {
      return res.status(400).json({ success: false, message: 'Branch selection is required' });
    }

    let subtotal = 0;
    const processedItems = [];

    // Validate products and calculate dynamic pricing
    for (const item of orderItems) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      }

      if (!product.isAvailable) {
        return res.status(400).json({ success: false, message: `Product ${product.name} is currently unavailable` });
      }

      // Check if product belongs to the selected branch
      if (product.branches && product.branches.length > 0) {
        if (!product.branches.includes(branch)) {
          return res.status(400).json({ 
            success: false, 
            message: `Product ${product.name} is not available at this branch` 
          });
        }
      }

      let itemPrice = product.basePrice;

      // Add variant price if selected
      if (item.variant) {
        const variantRef = product.variants.find(v => v.name === item.variant.name);
        if (variantRef) {
          itemPrice = variantRef.price; // Use variant price as base if specified
        }
      }

      // Add add-ons modifier
      if (item.selectedAddOns && item.selectedAddOns.length > 0) {
        item.selectedAddOns.forEach(addOn => {
          const addOnRef = product.addOns.find(a => a.name === addOn.name);
          if (addOnRef) itemPrice += addOnRef.price;
        });
      }

      const totalPriceForItem = itemPrice * item.quantity;
      subtotal += totalPriceForItem;

      processedItems.push({
        ...item,
        name: product.name,
        image: product.image,
        priceAtPurchase: itemPrice
      });
    }

    const tax = subtotal * 0.10; // 10% Tax
    const actualDeliveryFee = orderType === 'delivery' ? (deliveryFee || 5) : 0;
    const totalPrice = subtotal + tax + actualDeliveryFee;

    // Determine initial status based on payment method
    let initialStatus = 'pending';
    let paymentStatus = 'pending';
    
    if (paymentMethod === 'online') {
      initialStatus = 'awaiting_payment';
    } else if (paymentMethod === 'cod') {
      paymentStatus = 'cash_on_delivery';
    }

    const order = await Order.create({
      user: req.user._id,
      branch,
      orderItems: processedItems,
      subtotal,
      tax,
      deliveryFee: actualDeliveryFee,
      totalPrice,
      status: initialStatus,
      paymentMethod,
      paymentStatus,
      orderType,
      shippingAddress,
      orderHistory: [{
        status: initialStatus,
        note: 'Order created'
      }]
    });

    // If online payment, integration logic would go here (e.g., Stripe Session)
    let paymentUrl = null;
    if (paymentMethod === 'online') {
      // paymentUrl = await createStripeSession(order);
    }

    res.status(201).json({ 
      success: true, 
      data: order,
      paymentUrl // Return this to frontend to redirect
    });

    // Send notifications and save to DB after response
    try {
      const orderIdStr = order._id.toString();
      const shortId = orderIdStr.slice(-6);

      // Notify and Save for User
      await Notification.create({
        user: req.user._id,
        title: 'Order Placed!',
        body: `Your order #${shortId} has been received.`,
        data: { orderId: orderIdStr },
        type: 'order_status'
      });
      notificationService.sendToUser(req.user._id, {
        title: 'Order Placed!',
        body: `Your order #${shortId} has been received.`
      }, { orderId: orderIdStr });

      // Notify and Save for Admins
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminNotifications = admins.map(admin => ({
        user: admin._id,
        title: 'New Order Received',
        body: `Order #${shortId} placed for $${order.totalPrice}`,
        data: { orderId: orderIdStr, type: 'new_order' },
        type: 'new_order'
      }));
      await Notification.insertMany(adminNotifications);
      
      notificationService.sendToAdmins({
        title: 'New Order Received',
        body: `Order #${shortId} placed for $${order.totalPrice}`
      }, { orderId: orderIdStr, type: 'new_order' });
      
    } catch (pushErr) {
      console.error('Notification storage/send failed:', pushErr.message);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my-orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('branch').sort('-createdAt');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('branch');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Check ownership
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    res.status(200).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all orders (Admin Only)
// @route   GET /api/orders
exports.getAllOrders = async (req, res) => {
  try {
    const showArchived = req.query.archived === 'true';
    const query = showArchived ? {} : { isArchived: false };
    
    const orders = await Order.find(query).populate('user', 'id name firstName lastName').populate('branch').sort('-createdAt');
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Archive/Unarchive order (Admin Only)
// @route   PUT /api/orders/:id/archive
exports.archiveOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.isArchived = !order.isArchived;
    await order.save();

    res.status(200).json({ success: true, data: order, message: `Order ${order.isArchived ? 'archived' : 'restored'}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update order status (Admin Only)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    order.orderHistory.push({
      status,
      note: note || `Status updated to ${status}`
    });

    // Special handling for delivery/payment
    if (status === 'delivered') {
      if (order.paymentMethod === 'cod') {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentStatus = 'paid';
      }
    }

    await order.save();
    
    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      const userRoom = order.user.toString();
      console.log(`[SOCKET] Emitting update for order ${order._id} to user room: ${userRoom}`);
      // Emit to the user's specific room
      io.to(userRoom).emit('orderStatusUpdated', order);
      
      // Also emit to all admins if they are watching
      io.to('admins').emit('adminOrderStatusUpdated', order);
    } else {
      console.warn('[SOCKET] io instance not found in app');
    }
    
    res.status(200).json({ success: true, data: order });

    // Notify User about status update
    try {
      const statusMessages = {
        'confirmed': 'Your order has been confirmed and is being prepared!',
        'preparing': 'We are currently preparing your delicious meal.',
        'out_for_delivery': 'Your order is out for delivery! Get ready.',
        'delivered': 'Order delivered. Enjoy your meal!',
        'cancelled': 'Your order has been cancelled.'
      };

      if (statusMessages[status]) {
        // Save to DB
        await Notification.create({
          user: order.user,
          title: 'Order Update',
          body: statusMessages[status],
          data: { orderId: order._id.toString(), status },
          type: 'order_status'
        });

        // Send Push
        notificationService.sendToUser(order.user, {
          title: 'Order Update',
          body: statusMessages[status]
        }, { orderId: order._id.toString(), status });
      }
    } catch (pushErr) {
      console.error('Status update notification failed:', pushErr.message);
    }
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    // Only allow cancellation for certain statuses
    const cancellableStatuses = ['pending', 'awaiting_payment'];
    if (!cancellableStatuses.includes(order.status) && req.user.role !== 'admin') {
      return res.status(400).json({ 
        success: false, 
        message: `Order cannot be cancelled because it is already ${order.status}` 
      });
    }

    order.status = 'cancelled';
    order.orderHistory.push({
      status: 'cancelled',
      note: `Order cancelled by ${req.user.role === 'admin' ? 'Admin' : 'Customer'}`
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