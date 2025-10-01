const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User schema
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
    notes: { type: String, default: 'Updated password to superadmin' }
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

async function updateSuperAdminPassword() {
  try {
    // Connect directly to CRM_AdminPanel database
    const crmURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('📡 Connecting to CRM_AdminPanel database...');
    await mongoose.connect(crmURI);
    console.log('✅ Connected to CRM_AdminPanel database\n');
    
    // Find the superadmin user
    const user = await User.findOne({ username: 'superadmin' });
    if (!user) {
      console.log('❌ User "superadmin" not found in CRM_AdminPanel database');
      await mongoose.disconnect();
      return;
    }
    
    console.log('👤 Found superadmin user:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    // Update the password
    user.password = 'superadmin';
    user.metadata.notes = 'Password updated to superadmin';
    await user.save();
    
    console.log('\n✅ Password updated successfully!');
    console.log('\n📝 Updated Login Details:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin');
    console.log('   Role: superadmin');
    
    // Verify the update
    const updatedUser = await User.findOne({ username: 'superadmin' }).select('username name role isActive');
    console.log('\n🔍 Verification:');
    console.log(`   Username: ${updatedUser.username}`);
    console.log(`   Name: ${updatedUser.name}`);
    console.log(`   Role: ${updatedUser.role}`);
    console.log(`   Active: ${updatedUser.isActive}`);
    console.log(`   Last Updated: ${updatedUser.updatedAt.toLocaleString()}`);
    
    console.log('\n🎉 Super Admin user is ready to use!');
    
  } catch (error) {
    console.error('\n❌ Error updating password:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from CRM_AdminPanel database');
  }
}

updateSuperAdminPassword();
