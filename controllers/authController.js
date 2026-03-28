const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Sign JWT and return
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.registerUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this phone already exists' });
    }

    // Create user (Always default to 'user' role for public registration)
    const user = await User.create({ 
      firstName, 
      lastName, 
      phone, 
      password, 
      role: 'user' 
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role }
    });

    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      io.to('admins').emit('userRegistered', user);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate phone & password
    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide phone and password' });
    }

    // Check for user (and include password)
    const user = await User.findOne({ phone, isDeleted: false }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password match
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
exports.logoutUser = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || user.isDeleted) {
      return res.status(401).json({ success: false, message: 'Not authorized or user account deleted' });
    }

    res.status(200).json({
      success: true,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update current logged in user
// @route   PUT /api/auth/updateme
exports.updateMe = async (req, res) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, phone: user.phone, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const admin = require('../config/firebase');

// @desc    Update password after OTP verification
// @route   POST /api/auth/updatepassword-otp
exports.updatePasswordOtp = async (req, res) => {
  try {
    const { idToken, newPassword } = req.body;

    if (!idToken || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide ID Token and New Password' });
    }

    // 1. Verify the Firebase ID Token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebasePhone = decodedToken.phone_number;

    if (!firebasePhone) {
      return res.status(401).json({ success: false, message: 'Invalid token: No phone number associated' });
    }

    // 2. Cross-verify with the logged-in user's phone number
    const user = await User.findById(req.user.id);
    
    // Normalize phone numbers for comparison (e.g., removing +, spaces, or matching international format)
    // Most professional way: ensure the phone in your DB matches the one Firebase verified.
    if (user.phone !== firebasePhone && user.phone.replace('+', '') !== firebasePhone.replace('+', '')) {
      return res.status(403).json({ success: false, message: 'Verification failed: Phone number mismatch' });
    }

    // 3. Update the password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Firebase Auth Error:', err);
    res.status(401).json({ success: false, message: 'Token verification failed: ' + err.message });
  }
};

// @desc    Delete current logged in user
// @route   DELETE /api/auth/deleteme
exports.deleteMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete
    user.isDeleted = true;
    user.phone = `${user.phone}_deleted_${Date.now()}`;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};