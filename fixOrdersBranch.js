const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Order = require('./models/Order');
const Location = require('./models/Location');

dotenv.config();

const fixOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    // 1. Get the first available location to use as a default
    const defaultLocation = await Location.findOne();
    if (!defaultLocation) {
      console.error('No locations found! Please create a location first.');
      process.exit(1);
    }

    console.log(`Using default branch: ${defaultLocation.name} (${defaultLocation._id})`);

    // 2. Find all orders missing the branch field
    const ordersToFix = await Order.find({ branch: { $exists: false } });
    console.log(`Found ${ordersToFix.length} orders to fix.`);

    if (ordersToFix.length === 0) {
      console.log('No orders need fixing.');
      process.exit(0);
    }

    // 3. Update all orders
    const result = await Order.updateMany(
      { branch: { $exists: false } },
      { $set: { branch: defaultLocation._id } }
    );

    console.log(`Successfully updated ${result.modifiedCount} orders.`);
    process.exit(0);
  } catch (err) {
    console.error('Error fixing orders:', err.message);
    process.exit(1);
  }
};

fixOrders();
