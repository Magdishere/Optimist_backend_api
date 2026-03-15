const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const fixIndexes = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/optimist');
    
    console.log('Fetching Users collection...');
    const collections = await mongoose.connection.db.listCollections({ name: 'users' }).toArray();
    
    if (collections.length > 0) {
      console.log('Dropping email index...');
      // This drops the unique constraint on email
      await mongoose.connection.db.collection('users').dropIndex('email_1');
      console.log('Successfully dropped the email unique index!');
    } else {
      console.log('Users collection not found.');
    }
    
    process.exit();
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index already gone or never existed. You are good to go!');
    } else {
      console.error('Error:', err);
    }
    process.exit(1);
  }
};

fixIndexes();