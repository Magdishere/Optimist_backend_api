const express = require('express');
const { registerUser, loginUser, logoutUser, getMe, updateMe, deleteMe, updatePasswordOtp } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/updateme', protect, updateMe);
router.delete('/deleteme', protect, deleteMe);
router.post('/updatepassword-otp', protect, updatePasswordOtp);

module.exports = router;