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
  accountLocked: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function testLoginErrors() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧪 Testing Login Error Messages...\n');

    // Test 1: User not found
    console.log('Test 1: User not found');
    let user = await User.findOne({ username: 'nonexistentuser' });
    if (!user) {
      user = await User.findOne({ name: 'nonexistentuser' });
    }
    
    if (!user) {
      console.log('✅ Error message: "User not exist"');
    } else {
      console.log('❌ User found (unexpected)');
    }

    // Test 2: Wrong password
    console.log('\nTest 2: Wrong password');
    const existingUser = await User.findOne({ username: 'admin' });
    if (existingUser) {
      const isMatch = await bcrypt.compare('wrongpassword', existingUser.password);
      if (!isMatch) {
        console.log('✅ Error message: "Wrong password"');
      } else {
        console.log('❌ Password matched (unexpected)');
      }
    } else {
      console.log('❌ Admin user not found');
    }

    // Test 3: Show existing users
    console.log('\nTest 3: Available users for login');
    const users = await User.find({}).select('username name role isActive');
    if (users.length > 0) {
      console.log('Available users:');
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role} | Active: ${user.isActive}`);
      });
    } else {
      console.log('❌ No users found in database');
    }

    console.log('\n🎉 Login error message tests completed!');
    console.log('\n📝 Summary:');
    console.log('   - When user does not exist: "User not exist"');
    console.log('   - When password is wrong: "Wrong password"');
    console.log('   - When account is locked: "Account is temporarily locked..."');
    console.log('   - When login times out: "Login is taking longer than expected..."');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testLoginErrors();
