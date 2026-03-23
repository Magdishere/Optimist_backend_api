const admin = require('firebase-admin');
const path = require('path');

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // 1. Check if the JSON is provided as an environment variable (Best for Render/Heroku)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
      // 2. Fallback to local file (for your local development)
      const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
      serviceAccount = require(serviceAccountPath);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('CRITICAL: Firebase Admin SDK failed to initialize!');
    console.error('Error details:', error.message);
    console.warn('\n--- ACTION REQUIRED ---');
    console.warn('On Render: Add your service account JSON content to an environment variable named FIREBASE_SERVICE_ACCOUNT.');
    console.warn('Locally: Ensure config/firebase-service-account.json exists.');
    console.warn('------------------------\n');
  }
}

module.exports = admin;
