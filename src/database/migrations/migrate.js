const mongoose = require('mongoose');
require('dotenv').config();
const logger = require('../../utils/logger');

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const User = require('../../models/User');
    const bcrypt = require('bcryptjs');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
      
      const admin = await User.create({
        name: 'System Admin',
        email: process.env.ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      
      logger.info(`Admin user created: ${admin.email}`);
    } else {
      logger.info('Admin user already exists');
    }
    
    // Create indexes
    await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.db.collection('events').createIndex({ date: 1 });
    await mongoose.connection.db.collection('bookings').createIndex({ user: 1, event: 1 });
    
    logger.info('Database migration completed');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
};

createAdminUser();