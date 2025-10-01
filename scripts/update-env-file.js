const fs = require('fs');
const path = require('path');

console.log('🔧 Environment File Update Helper\n');

const envFilePath = path.join(__dirname, '..', '.env.local');

// Check if .env.local exists
if (!fs.existsSync(envFilePath)) {
  console.log('❌ .env.local file not found!');
  console.log('Please create the file first.');
  process.exit(1);
}

// Read current content
const currentContent = fs.readFileSync(envFilePath, 'utf8');
console.log('📋 Current .env.local content:');
console.log(currentContent);

// New MongoDB URI with database name
const newMongoURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';

// Update the content
const updatedContent = currentContent.replace(
  /MONGODB_URI=.*/,
  `MONGODB_URI=${newMongoURI}`
);

console.log('\n📋 Updated .env.local content:');
console.log(updatedContent);

console.log('\n🔍 What changed:');
console.log('   - Added database name: /CRM_AdminPanel');
console.log('   - This will connect to your specific database instead of default "test" database');

console.log('\n📝 To update your .env.local file:');
console.log('   1. Open .env.local file in your editor');
console.log('   2. Replace the MONGODB_URI line with:');
console.log(`   MONGODB_URI=${newMongoURI}`);

console.log('\n🧪 After updating, test the connection with:');
console.log('   node scripts/test-db-connection.js');

console.log('\n✅ Migration Status:');
console.log('   - Users have been migrated to CRM_AdminPanel database');
console.log('   - You can now use the new database URI');
console.log('   - Login credentials remain the same:');
console.log('     - Username: admin');
console.log('     - Password: admin123');

console.log('\n🚀 Ready to update?');
console.log('   Update your .env.local file and test the connection!');
