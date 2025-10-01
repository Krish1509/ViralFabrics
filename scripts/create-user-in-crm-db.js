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
    notes: { type: String, default: 'Created in CRM_AdminPanel database' }
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

async function createUserInCRMDatabase() {
  try {
    // Connect directly to CRM_AdminPanel database
    const crmURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
    
    console.log('📡 Connecting to CRM_AdminPanel database...');
    await mongoose.connect(crmURI);
    console.log('✅ Connected to CRM_AdminPanel database');
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: 'superadmin' });
    if (existingUser) {
      console.log('⚠️  User "superadmin" already exists in CRM_AdminPanel database');
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Active: ${existingUser.isActive}`);
      await mongoose.disconnect();
      return;
    }
    
    // Create the new superadmin user
    const superAdmin = new User({
      name: 'Super Admin',
      username: 'superadmin',
      password: 'superadmin',
      email: 'superadmin@company.com',
      phoneNumber: '+1234567890',
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
        department: 'Administration',
        employeeId: 'SA001',
        notes: 'Super admin user created in CRM_AdminPanel database'
      }
    });
    
    await superAdmin.save();
    
    console.log('\n🎉 Super Admin user created successfully in CRM_AdminPanel database!');
    console.log('\n📝 Login Details:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin');
    console.log('   Role: superadmin');
    console.log('   Email: superadmin@company.com');
    
    // List all users in the database
    const allUsers = await User.find({}).select('username name role isActive');
    console.log(`\n👥 Total users in CRM_AdminPanel database: ${allUsers.length}`);
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role}`);
    });
    
    console.log('\n🔐 You can now log in to the application with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Error creating user:', error.message);
    if (error.code === 11000) {
      console.log('\n💡 Username already exists. Try a different username.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from CRM_AdminPanel database');
  }
}

createUserInCRMDatabase();
