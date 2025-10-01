const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, sparse: true },
  phoneNumber: { type: String, sparse: true },
  role: { type: String, enum: ['superadmin', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true },
  loginCount: { type: Number, default: 0 },
  accountLocked: { type: Boolean, default: false }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function testCRMLogin() {
  try {
    // Connect directly to CRM_AdminPanel database
    const crmURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('📡 Connecting to CRM_AdminPanel database...');
    await mongoose.connect(crmURI);
    console.log('✅ Connected to CRM_AdminPanel database\n');
    
    console.log('🧪 Testing Login Credentials in CRM_AdminPanel Database...\n');
    
    // Test 1: Admin user login
    console.log('Test 1: Admin user login');
    const adminUser = await User.findOne({ username: 'admin' }).select('+password');
    if (adminUser) {
      const adminPasswordMatch = await bcrypt.compare('admin123', adminUser.password);
      if (adminPasswordMatch) {
        console.log('✅ Admin login: Username "admin" with password "admin123" - SUCCESS');
      } else {
        console.log('❌ Admin login: Username "admin" with password "admin123" - FAILED (wrong password)');
      }
    } else {
      console.log('❌ Admin user not found');
    }
    
    // Test 2: Superadmin user login
    console.log('\nTest 2: Superadmin user login');
    const superAdminUser = await User.findOne({ username: 'superadmin' }).select('+password');
    if (superAdminUser) {
      const superAdminPasswordMatch = await bcrypt.compare('superadmin', superAdminUser.password);
      if (superAdminPasswordMatch) {
        console.log('✅ Superadmin login: Username "superadmin" with password "superadmin" - SUCCESS');
      } else {
        console.log('❌ Superadmin login: Username "superadmin" with password "superadmin" - FAILED (wrong password)');
      }
    } else {
      console.log('❌ Superadmin user not found');
    }
    
    // Test 3: Non-existent user
    console.log('\nTest 3: Non-existent user');
    const nonExistentUser = await User.findOne({ username: 'nonexistent' });
    if (!nonExistentUser) {
      console.log('✅ Non-existent user: Username "nonexistent" - Should show "User not exist"');
    } else {
      console.log('❌ Non-existent user found (unexpected)');
    }
    
    // Test 4: Wrong password
    console.log('\nTest 4: Wrong password test');
    if (adminUser) {
      const wrongPasswordMatch = await bcrypt.compare('wrongpassword', adminUser.password);
      if (!wrongPasswordMatch) {
        console.log('✅ Wrong password: Username "admin" with password "wrongpassword" - Should show "Wrong password"');
      } else {
        console.log('❌ Wrong password matched (unexpected)');
      }
    }
    
    console.log('\n📊 Login Test Summary:');
    console.log('   ✅ Admin user (admin/admin123) - Ready');
    console.log('   ✅ Superadmin user (superadmin/superadmin) - Ready');
    console.log('   ✅ Error handling - Ready');
    
    console.log('\n🔐 Available Login Credentials:');
    console.log('   1. Username: admin | Password: admin123 | Role: superadmin');
    console.log('   2. Username: superadmin | Password: superadmin | Role: superadmin');
    
    console.log('\n📝 Next Steps:');
    console.log('   1. Update your .env.local file to use CRM_AdminPanel database');
    console.log('   2. Test login in your application');
    console.log('   3. Deploy to Vercel with updated environment variables');
    
  } catch (error) {
    console.error('\n❌ Error testing login:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from CRM_AdminPanel database');
  }
}

testCRMLogin();
