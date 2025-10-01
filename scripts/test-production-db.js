const mongoose = require('mongoose');

async function testProductionDatabase() {
  console.log('🧪 Testing Production Database Connection...\n');
  
  const startTime = Date.now();
  
  try {
    // Use production MongoDB URI
    const prodURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
    
    // Production-optimized connection options
    const opts = {
      bufferCommands: true,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      family: 4,
      retryWrites: true,
      retryReads: true,
      connectTimeoutMS: 10000,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 5000,
      maxConnecting: 1,
      directConnection: false,
    };

    console.log('📡 Connecting to production database...');
    await mongoose.connect(prodURI, opts);
    
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
    
    // Test specific user lookup
    const userLookupStart = Date.now();
    const superAdminUser = await mongoose.connection.db.collection('users').findOne({ username: 'superadmin' });
    const userLookupTime = Date.now() - userLookupStart;
    console.log(`✅ User lookup successful (${userLookupTime}ms)`);
    
    console.log('\n📊 Production Connection Summary:');
    console.log(`   Total connection time: ${connectionTime}ms`);
    console.log(`   Database ping: ${pingTime}ms`);
    console.log(`   User query: ${userTestTime}ms`);
    console.log(`   User lookup: ${userLookupTime}ms`);
    console.log(`   Users in database: ${userCount}`);
    
    if (connectionTime > 5000) {
      console.log('\n⚠️  Warning: Connection time is slow (>5s). This may cause timeouts on Vercel.');
    }
    
    if (pingTime > 2000) {
      console.log('\n⚠️  Warning: Database ping is slow (>2s). Check your MongoDB Atlas configuration.');
    }
    
    if (userLookupTime > 1000) {
      console.log('\n⚠️  Warning: User lookup is slow (>1s). This may cause login timeouts.');
    }
    
    console.log('\n🎉 Production database test completed successfully!');
    console.log('\n🔐 Login credentials for production:');
    console.log('   Username: admin | Password: admin123');
    console.log('   Username: superadmin | Password: superadmin');
    
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    console.error(`\n❌ Connection failed after ${connectionTime}ms`);
    console.error('Error details:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('\n💡 Timeout suggestions:');
      console.log('   - Check your MongoDB Atlas cluster status');
      console.log('   - Verify your IP whitelist includes 0.0.0.0/0');
      console.log('   - Consider upgrading your MongoDB Atlas cluster');
      console.log('   - Check network connectivity from Vercel region');
    }
    
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from production database');
  }
}

testProductionDatabase();
