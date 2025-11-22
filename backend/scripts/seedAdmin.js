// scripts/seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User'); // adjust path if script in a different folder

const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO);
    const email = 'admin@example.com';
    const exists = await User.findOne({ email });
    if (exists) {
      console.log('Admin already exists:', exists.email);
      await mongoose.disconnect();
      process.exit(0);
    }
    const admin = await User.create({
      username: 'admin',
      email,
      password: 'Admin@123', // change immediately in prod
      role: 'admin',
    });
    console.log('Created admin:', admin.email);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
})();
