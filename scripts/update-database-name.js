const fs = require('fs');
const path = require('path');

console.log('🔧 Database Name Update Helper\n');

// Current connection string
const currentURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// New connection string with database name
const newURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';

console.log('📋 Current MongoDB URI:');
console.log(currentURI);
console.log('\n📋 New MongoDB URI (with database name):');
console.log(newURI);

console.log('\n🔍 What changed:');
console.log('   - Added database name: /CRM_AdminPanel');
console.log('   - This will connect to your specific database instead of default "test" database');

console.log('\n📝 To update your .env.local file:');
console.log('   1. Open .env.local file');
console.log('   2. Replace the MONGODB_URI line with:');
console.log(`   MONGODB_URI=${newURI}`);

console.log('\n🧪 After updating, test the connection with:');
console.log('   node scripts/test-db-connection.js');

console.log('\n⚠️  Important Notes:');
console.log('   - Make sure your CRM_AdminPanel database exists in MongoDB Atlas');
console.log('   - If the database doesn\'t exist, MongoDB will create it automatically');
console.log('   - Your existing data might be in the "test" database');
console.log('   - You may need to migrate data from "test" to "CRM_AdminPanel"');

console.log('\n💡 Database Migration (if needed):');
console.log('   If your data is in the "test" database, you can:');
console.log('   1. Export data from "test" database');
console.log('   2. Import data to "CRM_AdminPanel" database');
console.log('   3. Or create users directly in "CRM_AdminPanel" database');

console.log('\n🚀 Ready to update?');
console.log('   Update your .env.local file and run the test script!');
