const express = require('express');
const { getExchangeRate, updateExchangeRate } = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/exchange-rate', getExchangeRate);

router.put('/exchange-rate', protect, authorize('admin'), updateExchangeRate);

module.exports = router;