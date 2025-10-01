const mongoose = require('mongoose');
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

async function migrateDatabase() {
  console.log('🔄 Database Migration Helper\n');
  
  // Current URI (test database)
  const currentURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  
  // New URI (CRM_AdminPanel database)
  const newURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    console.log('📡 Connecting to current database (test)...');
    await mongoose.connect(currentURI);
    console.log('✅ Connected to current database');
    
    // Get current database name
    const currentDbName = mongoose.connection.db.databaseName;
    console.log(`📊 Current database: ${currentDbName}`);
    
    // Check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    
    if (collections.length > 0) {
      console.log('\n📋 Collections:');
      collections.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col.name}`);
      });
      
      // Check users collection
      const User = mongoose.model('User', userSchema);
      const userCount = await User.countDocuments();
      console.log(`\n👥 Users in current database: ${userCount}`);
      
      if (userCount > 0) {
        const users = await User.find({}).select('username name role isActive');
        console.log('\n📝 Current users:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role}`);
        });
      }
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from current database');
    
    console.log('\n📡 Connecting to new database (CRM_AdminPanel)...');
    await mongoose.connect(newURI);
    console.log('✅ Connected to new database');
    
    const newDbName = mongoose.connection.db.databaseName;
    console.log(`📊 New database: ${newDbName}`);
    
    // Check if users exist in new database
    const UserNew = mongoose.model('User', userSchema);
    const newUserCount = await UserNew.countDocuments();
    console.log(`👥 Users in new database: ${newUserCount}`);
    
    if (newUserCount > 0) {
      const newUsers = await UserNew.find({}).select('username name role isActive');
      console.log('\n📝 Users in new database:');
      newUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Username: "${user.username}" | Name: "${user.name}" | Role: ${user.role}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from new database');
    
    console.log('\n📋 Migration Summary:');
    console.log(`   Current database (${currentDbName}): ${collections.length} collections, ${userCount || 0} users`);
    console.log(`   New database (${newDbName}): ${newUserCount} users`);
    
    if ((userCount || 0) > 0 && newUserCount === 0) {
      console.log('\n⚠️  Migration needed:');
      console.log('   - You have users in the current database');
      console.log('   - No users in the new database');
      console.log('   - You may need to create users in the new database');
    } else if (newUserCount > 0) {
      console.log('\n✅ Migration complete:');
      console.log('   - Users already exist in the new database');
      console.log('   - You can safely use the new database');
    } else {
      console.log('\n💡 No migration needed:');
      console.log('   - No users in either database');
      console.log('   - You can create new users in the new database');
    }
    
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
  console.log('\n📖 Database Migration Helper');
  console.log('\nThis script helps you understand the difference between your current and new database.');
  console.log('\nUsage:');
  console.log('node scripts/migrate-database.js');
  console.log('\nThe script will:');
  console.log('  1. Connect to current database (test)');
  console.log('  2. Show collections and users');
  console.log('  3. Connect to new database (CRM_AdminPanel)');
  console.log('  4. Show users in new database');
  console.log('  5. Provide migration recommendations');
  process.exit(0);
}

migrateDatabase();
