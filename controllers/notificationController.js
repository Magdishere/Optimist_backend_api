const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications/my
// @access  Private
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all notifications (Admin Only)
// @route   GET /api/notifications
// @access  Private/Admin
exports.getAllNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().populate('user', 'firstName lastName').sort('-createdAt');
    res.status(200).json({ success: true, count: notifications.length, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Check ownership
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      io.to(notification.user.toString()).emit('notificationRead', notification);
      if (req.user.role === 'admin') {
        io.to('admins').emit('adminNotificationRead', notification);
      }
    }

    res.status(200).json({ success: true, data: notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete single notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });

    // Check ownership
    if (notification.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    const userId = notification.user.toString();
    await notification.deleteOne();

    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      io.to(userId).emit('notificationDeleted', req.params.id);
      if (req.user.role === 'admin') {
        io.to('admins').emit('adminNotificationDeleted', req.params.id);
      }
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Clear all my notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
exports.clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user.id });

    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      io.to(req.user.id).emit('notificationsCleared');
    }

    res.status(200).json({ success: true, message: 'All notifications cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
