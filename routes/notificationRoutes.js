const express = require('express');
const { 
  getMyNotifications, 
  getAllNotifications, 
  markAsRead 
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', getMyNotifications);
router.put('/:id/read', markAsRead);

// Admin-only route
router.get('/', authorize('admin'), getAllNotifications);

module.exports = router;
