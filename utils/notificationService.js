const admin = require('../config/firebase');
const User = require('../models/User');

/**
 * Send a push notification to a specific user
 * @param {string} userId - The ID of the user to send the notification to
 * @param {object} notification - { title, body }
 * @param {object} data - Optional metadata for deep linking (e.g., { orderId: '123' })
 */
exports.sendToUser = async (userId, notification, data = {}) => {
  try {
    const user = await User.findById(userId).select('fcmTokens');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return;
    }

    const message = {
      notification,
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // For Android deep linking
      },
      tokens: user.fcmTokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    // Clean up invalid tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(user.fcmTokens[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: failedTokens } }
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
};

/**
 * Send a push notification to all admin users
 * @param {object} notification - { title, body }
 * @param {object} data - Optional metadata
 */
exports.sendToAdmins = async (notification, data = {}) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('fcmTokens');
    const allAdminTokens = admins.flatMap(admin => admin.fcmTokens);

    if (allAdminTokens.length === 0) return;

    const message = {
      notification,
      data,
      tokens: allAdminTokens,
    };

    return await admin.messaging().sendEachForMulticast(message);
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};
