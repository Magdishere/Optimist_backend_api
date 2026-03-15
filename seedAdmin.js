const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/optimist');

const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ phone: '76326960' });
    if (adminExists) {
      console.log('Admin already exists');
      process.exit();
    }

    const admin = await User.create({
      firstName: 'Magd',
      lastName: 'Admin',
      phone: '76326960',
      password: '123456',
      role: 'admin'
    });

    console.log('Admin user created successfully');
    console.log('Phone: 76326960');
    console.log('Password: 123456');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedAdmin();