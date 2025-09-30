const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  loginCount: { type: Number, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, enum: ['en', 'es', 'fr'], default: 'en' },
    notifications: { type: Boolean, default: true },
    timezone: { type: String, default: 'UTC' }
  },
  metadata: {
    createdBy: { type: String, default: 'system' },
    department: { type: String, default: 'IT' },
    notes: { type: String, default: 'Test user created by script' }
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if test user already exists
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      console.log('Test user already exists!');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Role: superadmin');
      await mongoose.disconnect();
      return;
    }

    // Create test user
    const testUser = new User({
      name: 'Admin User',
      username: 'admin',
      password: 'admin123',
      role: 'superadmin',
      isActive: true,
      preferences: {
        theme: 'light',
        language: 'en',
        notifications: true,
        timezone: 'UTC'
      },
      metadata: {
        createdBy: 'system',
        department: 'IT',
        notes: 'Default test user for development'
      }
    });

    await testUser.save();
    console.log('Test user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Role: superadmin');
    console.log('You can now log in to the application.');

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestUser();
