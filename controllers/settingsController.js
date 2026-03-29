const Settings = require('../models/Settings');

// @desc    Get current exchange rate
// @route   GET /api/settings/exchange-rate
// @access  Public
exports.getExchangeRate = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist yet, create default
    if (!settings) {
      settings = await Settings.create({ usdToLbpRate: 89500 });
    }

    res.status(200).json({ 
      success: true, 
      data: {
        usdToLbpRate: settings.usdToLbpRate,
        updatedAt: settings.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update exchange rate
// @route   PUT /api/settings/exchange-rate
// @access  Private/Admin
exports.updateExchangeRate = async (req, res) => {
  try {
    const { usdToLbpRate } = req.body;

    if (!usdToLbpRate) {
      return res.status(400).json({ success: false, message: 'Please provide the exchange rate' });
    }

    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({ 
        usdToLbpRate,
        lastUpdatedBy: req.user.id 
      });
    } else {
      settings.usdToLbpRate = usdToLbpRate;
      settings.lastUpdatedBy = req.user.id;
      await settings.save();
    }

    res.status(200).json({ success: true, data: settings });

    // --- REAL-TIME WEB SOCKET EMIT ---
    const io = req.app.get('socketio');
    if (io) {
      io.emit('exchangeRateUpdated', { usdToLbpRate: settings.usdToLbpRate });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};