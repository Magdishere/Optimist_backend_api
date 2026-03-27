const express = require('express');
const { 
  getMyNotifications, 
  getAllNotifications, 
  markAsRead,
  deleteNotification,
  clearAllNotifications
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', getMyNotifications);
router.delete('/clear-all', clearAllNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Admin-only route
router.get('/', authorize('admin'), getAllNotifications);

module.exports = router;
