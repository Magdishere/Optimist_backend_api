const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const Order = require('./models/Order');

const fixOrders = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    console.log('Updating all orders to set isArchived: false...');
    const result = await Order.updateMany(
      { isArchived: { $exists: false } },
      { $set: { isArchived: false } }
    );

    console.log(`Success! Updated ${result.modifiedCount} orders.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

fixOrders();
