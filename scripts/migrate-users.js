const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

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
    notes: { type: String, default: 'Migrated from test database' }
  }
}, { timestamps: true });

async function migrateUsers() {
  console.log('🔄 User Migration Script\n');
  
  // Current URI (test database)
  const currentURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  // New URI (CRM_AdminPanel database)
  const newURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    console.log('📡 Step 1: Connecting to source database (test)...');
    await mongoose.connect(currentURI);
    console.log('✅ Connected to source database');
    
    const UserSource = mongoose.model('User', userSchema);
    const users = await UserSource.find({}).select('+password');
    console.log(`👥 Found ${users.length} users in source database`);
    
    if (users.length === 0) {
      console.log('❌ No users found in source database');
      await mongoose.disconnect();
      return;
    }
    
    console.log('\n📝 Users to migrate:');
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role}`);
    });
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from source database');
    
    console.log('\n📡 Step 2: Connecting to target database (CRM_AdminPanel)...');
    await mongoose.connect(newURI);
    console.log('✅ Connected to target database');
    
    const UserTarget = mongoose.model('User', userSchema);
    
    console.log('\n🔄 Step 3: Migrating users...');
    let migratedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      try {
        // Check if user already exists
        const existingUser = await UserTarget.findOne({ username: user.username });
        if (existingUser) {
          console.log(`⏭️  Skipped: User "${user.username}" already exists`);
          skippedCount++;
          continue;
        }
        
        // Create new user in target database
        const newUser = new UserTarget({
          name: user.name,
          username: user.username,
          password: user.password, // Keep the hashed password
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          role: user.role,
          isActive: user.isActive,
          loginCount: user.loginCount,
          failedLoginAttempts: user.failedLoginAttempts,
          accountLocked: user.accountLocked,
          preferences: user.preferences,
          metadata: {
            ...user.metadata,
            notes: 'Migrated from test database'
          }
        });
        
        await newUser.save();
        console.log(`✅ Migrated: User "${user.username}" (${user.role})`);
        migratedCount++;
        
      } catch (error) {
        console.log(`❌ Failed to migrate user "${user.username}": ${error.message}`);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Failed: ${users.length - migratedCount - skippedCount}`);
    
    // Verify migration
    const finalUserCount = await UserTarget.countDocuments();
    console.log(`\n✅ Final user count in CRM_AdminPanel database: ${finalUserCount}`);
    
    if (finalUserCount > 0) {
      const finalUsers = await UserTarget.find({}).select('username name role isActive');
      console.log('\n📝 Users in CRM_AdminPanel database:');
      finalUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role}`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Update your .env.local file with the new database URI');
    console.log('   2. Test the connection: node scripts/test-db-connection.js');
    console.log('   3. Test login with your migrated users');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Show usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 User Migration Script');
  console.log('\nThis script migrates users from the "test" database to the "CRM_AdminPanel" database.');
  console.log('\nUsage:');
  console.log('node scripts/migrate-users.js');
  console.log('\nThe script will:');
  console.log('  1. Connect to source database (test)');
  console.log('  2. Find all users');
  console.log('  3. Connect to target database (CRM_AdminPanel)');
  console.log('  4. Migrate users (skip if already exist)');
  console.log('  5. Show migration summary');
  process.exit(0);
}

migrateUsers();
