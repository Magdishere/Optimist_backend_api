const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
    });
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('CRITICAL: Firebase Admin SDK failed to initialize!');
    console.error('Error details:', error.message);
    console.warn('\n--- ACTION REQUIRED ---');
    console.warn('1. Ensure you downloaded your service account JSON from Firebase Console.');
    console.warn('2. Confirm it is saved as: optimist-backend/config/firebase-service-account.json');
    console.warn('3. Verify the file content is a valid JSON.');
    console.warn('------------------------\n');
  }
}

module.exports = admin;