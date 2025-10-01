const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// User schema (simplified version)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, sparse: true },
  phoneNumber: { type: String, sparse: true },
  role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  loginCount: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    language: { type: String, enum: ['en', 'es', 'fr'], default: 'en' }
  },
  metadata: {
    createdBy: { type: String, default: 'system' },
    department: { type: String, default: 'IT' },
    employeeId: { type: String }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    
    if (users.length === 0) {
      console.log('📭 No users found in the database.');
      console.log('\n💡 To create a super admin user, run:');
      console.log('node scripts/create-super-admin.js');
      await mongoose.disconnect();
      return;
    }

    console.log(`👥 Found ${users.length} user(s) in the database:\n`);
    
    users.forEach((user, index) => {
      console.log(`🔸 User #${index + 1}:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Email: ${user.email || 'Not provided'}`);
      console.log(`   Phone: ${user.phoneNumber || 'Not provided'}`);
      console.log(`   Role: ${user.role.toUpperCase()}`);
      console.log(`   Status: ${user.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`   Account Locked: ${user.accountLocked ? '🔒 Yes' : '🔓 No'}`);
      console.log(`   Login Count: ${user.loginCount}`);
      console.log(`   Department: ${user.metadata?.department || 'Not specified'}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Last Updated: ${user.updatedAt.toLocaleDateString()}`);
      console.log('');
    });

    // Show summary
    const superAdmins = users.filter(u => u.role === 'superadmin').length;
    const regularUsers = users.filter(u => u.role === 'user').length;
    const activeUsers = users.filter(u => u.isActive).length;
    const lockedUsers = users.filter(u => u.accountLocked).length;

    console.log('📊 Summary:');
    console.log(`   Super Admins: ${superAdmins}`);
    console.log(`   Regular Users: ${regularUsers}`);
    console.log(`   Active Users: ${activeUsers}`);
    console.log(`   Locked Users: ${lockedUsers}`);

    console.log('\n💡 Commands:');
    console.log('   Create new user: node scripts/create-super-admin.js');
    console.log('   Create custom user: node scripts/create-super-admin.js "Name" "username" "password" "email" "phone" "department"');

  } catch (error) {
    console.error('\n❌ Error listing users:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

listUsers();
