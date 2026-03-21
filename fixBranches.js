const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Location = require('./models/Location');

dotenv.config();

const fixBranches = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');

    const branches = await Location.find();
    const branchIds = branches.map(b => b._id);

    if (branchIds.length === 0) {
      console.log('No branches found. Please create at least one branch first.');
      process.exit(1);
    }

    console.log(`Found ${branchIds.length} branches. Updating products and categories...`);

    // Update Products
    const productResult = await Product.updateMany(
      { $or: [{ branches: { $exists: false } }, { branches: { $size: 0 } }] },
      { $set: { branches: branchIds } }
    );
    console.log(`Updated ${productResult.modifiedCount} products.`);

    // Update Categories
    const categoryResult = await Category.updateMany(
      { $or: [{ branches: { $exists: false } }, { branches: { $size: 0 } }] },
      { $set: { branches: branchIds } }
    );
    console.log(`Updated ${categoryResult.modifiedCount} categories.`);

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

fixBranches();
