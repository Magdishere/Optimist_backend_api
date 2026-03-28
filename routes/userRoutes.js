const express = require('express');
const { 
  getUsers, 
  getUser, 
  createUser, 
  updateUser, 
  deleteUser,
  saveFcmToken,
  updateProfile,
  deleteProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

router.use(protect);

// User-specific routes
router.post('/fcm-token', saveFcmToken);
router.route('/profile')
  .put(updateProfile)
  .delete(deleteProfile);

// Admin-only routes
router.use(authorize('admin'));

router.route('/')
  .get(getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;