const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, sparse: true },
  phoneNumber: { type: String, sparse: true },
  address: { type: String },
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
    employeeId: { type: String },
    notes: { type: String, default: 'Super admin user created by script' }
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

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get user details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const name = args[0] || 'Super Admin';
    const username = args[1] || 'superadmin';
    const password = args[2] || 'admin123456';
    const email = args[3] || 'admin@company.com';
    const phoneNumber = args[4] || '+1234567890';
    const department = args[5] || 'Administration';

    console.log('\n📋 Creating Super Admin User with details:');
    console.log(`Name: ${name}`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Email: ${email}`);
    console.log(`Phone: ${phoneNumber}`);
    console.log(`Department: ${department}`);

    // Check if user already exists
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      console.log('\n⚠️  User already exists!');
      console.log(`Username: ${existingUser.username}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Active: ${existingUser.isActive}`);
      console.log('\nTo create a different user, run:');
      console.log('node scripts/create-super-admin.js "Your Name" "your_username" "your_password" "your_email" "your_phone" "your_department"');
      await mongoose.disconnect();
      return;
    }

    // Create super admin user
    const superAdmin = new User({
      name: name,
      username: username,
      password: password,
      email: email,
      phoneNumber: phoneNumber,
      address: 'Company Address',
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
        department: department,
        employeeId: 'SA001',
        notes: 'Super admin user with full system access'
      }
    });

    await superAdmin.save();
    
    console.log('\n🎉 Super Admin user created successfully!');
    console.log('\n📝 Login Details:');
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);
    console.log(`Role: superadmin`);
    console.log(`Email: ${email}`);
    console.log('\n🔐 You can now log in to the application with these credentials.');
    console.log('\n💡 To create additional users, run:');
    console.log('node scripts/create-super-admin.js "User Name" "username" "password" "email" "phone" "department"');

  } catch (error) {
    console.error('\n❌ Error creating super admin user:', error.message);
    if (error.code === 11000) {
      console.log('\n💡 Username or email already exists. Try a different username or email.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Show usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Super Admin User Creation Script');
  console.log('\nUsage:');
  console.log('node scripts/create-super-admin.js [name] [username] [password] [email] [phone] [department]');
  console.log('\nExamples:');
  console.log('node scripts/create-super-admin.js');
  console.log('node scripts/create-super-admin.js "John Doe" "john" "mypassword123" "john@company.com" "+1234567890" "IT"');
  console.log('\nDefault values will be used if arguments are not provided.');
  process.exit(0);
}

createSuperAdmin();
