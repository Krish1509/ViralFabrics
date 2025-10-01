const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...\n');
  
  const startTime = Date.now();
  
  try {
    // Test connection with optimized settings for Vercel
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 120000,
      family: 4,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 30000,
      maxIdleTimeMS: 60000,
      heartbeatFrequencyMS: 10000,
      maxConnecting: 2,
    };

    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI, opts);
    
    const connectionTime = Date.now() - startTime;
    console.log(`✅ Connected successfully in ${connectionTime}ms`);
    
    // Test database operations
    console.log('\n🧪 Testing database operations...');
    
    // Test ping
    const pingStart = Date.now();
    await mongoose.connection.db.admin().ping();
    const pingTime = Date.now() - pingStart;
    console.log(`✅ Database ping successful (${pingTime}ms)`);
    
    // Test user collection
    const userTestStart = Date.now();
    const userCount = await mongoose.connection.db.collection('users').countDocuments();
    const userTestTime = Date.now() - userTestStart;
    console.log(`✅ User collection accessible (${userCount} users, ${userTestTime}ms)`);
    
    // Test order collection
    const orderTestStart = Date.now();
    const orderCount = await mongoose.connection.db.collection('orders').countDocuments();
    const orderTestTime = Date.now() - orderTestStart;
    console.log(`✅ Order collection accessible (${orderCount} orders, ${orderTestTime}ms)`);
    
    console.log('\n📊 Connection Summary:');
    console.log(`   Total connection time: ${connectionTime}ms`);
    console.log(`   Database ping: ${pingTime}ms`);
    console.log(`   User query: ${userTestTime}ms`);
    console.log(`   Order query: ${orderTestTime}ms`);
    console.log(`   Users in database: ${userCount}`);
    console.log(`   Orders in database: ${orderCount}`);
    
    if (connectionTime > 10000) {
      console.log('\n⚠️  Warning: Connection time is slow (>10s). This may cause timeouts on Vercel.');
    }
    
    if (pingTime > 5000) {
      console.log('\n⚠️  Warning: Database ping is slow (>5s). Check your MongoDB Atlas configuration.');
    }
    
    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    console.error(`\n❌ Connection failed after ${connectionTime}ms`);
    console.error('Error details:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout suggestions:');
      console.log('   - Check your MongoDB Atlas cluster status');
      console.log('   - Verify your IP whitelist includes 0.0.0.0/0');
      console.log('   - Check your connection string format');
      console.log('   - Consider upgrading your MongoDB Atlas cluster');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication suggestions:');
      console.log('   - Verify your username and password');
      console.log('   - Check your database user permissions');
      console.log('   - Ensure the user has read/write access');
    }
    
    if (error.message.includes('network')) {
      console.log('\n💡 Network suggestions:');
      console.log('   - Check your internet connection');
      console.log('   - Verify MongoDB Atlas is accessible');
      console.log('   - Check firewall settings');
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Show usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Database Connection Test Script');
  console.log('\nThis script tests your MongoDB Atlas connection with the same settings used in production.');
  console.log('\nUsage:');
  console.log('node scripts/test-db-connection.js');
  console.log('\nThe script will:');
  console.log('  1. Test connection to MongoDB Atlas');
  console.log('  2. Measure connection time');
  console.log('  3. Test database operations');
  console.log('  4. Provide performance recommendations');
  process.exit(0);
}

testDatabaseConnection();
