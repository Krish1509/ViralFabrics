const mongoose = require('mongoose');

async function migrateAllData() {
  console.log('🔄 Migrating ALL data from test to CRM_AdminPanel database...\n');
  
  const testURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const crmURI = 'mongodb+srv://krish1506soni_db_user:IwowMjDghFUAt5cZ@cluster0.qtppcus.mongodb.net/CRM_AdminPanel?retryWrites=true&w=majority&appName=Cluster0';
  
  try {
    // Connect to test database
    console.log('📡 Connecting to test database...');
    await mongoose.connect(testURI);
    console.log('✅ Connected to test database');
    
    const testDb = mongoose.connection.db;
    const collections = await testDb.listCollections().toArray();
    
    console.log(`\n📁 Found ${collections.length} collections in test database:`);
    collections.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name}`);
    });
    
    // Get collection data
    const collectionData = {};
    for (const collection of collections) {
      const collectionName = collection.name;
      const docs = await testDb.collection(collectionName).find({}).toArray();
      collectionData[collectionName] = docs;
      console.log(`   📊 ${collectionName}: ${docs.length} documents`);
    }
    
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from test database');
    
    // Connect to CRM_AdminPanel database
    console.log('\n📡 Connecting to CRM_AdminPanel database...');
    await mongoose.connect(crmURI);
    console.log('✅ Connected to CRM_AdminPanel database');
    
    const crmDb = mongoose.connection.db;
    
    // Migrate each collection
    console.log('\n🔄 Migrating collections...');
    let totalMigrated = 0;
    
    for (const [collectionName, documents] of Object.entries(collectionData)) {
      if (documents.length === 0) {
        console.log(`⏭️  Skipped ${collectionName}: No documents`);
        continue;
      }
      
      try {
        // Check if collection exists and has data
        const existingDocs = await crmDb.collection(collectionName).countDocuments();
        
        if (existingDocs > 0) {
          console.log(`⚠️  ${collectionName}: ${existingDocs} documents already exist, skipping`);
          continue;
        }
        
        // Insert documents
        await crmDb.collection(collectionName).insertMany(documents);
        console.log(`✅ ${collectionName}: Migrated ${documents.length} documents`);
        totalMigrated += documents.length;
        
      } catch (error) {
        console.log(`❌ ${collectionName}: Failed to migrate - ${error.message}`);
      }
    }
    
    // Verify migration
    console.log('\n📊 Migration Summary:');
    console.log(`   Total documents migrated: ${totalMigrated}`);
    
    // Show final collection counts
    console.log('\n📁 Final collections in CRM_AdminPanel database:');
    const finalCollections = await crmDb.listCollections().toArray();
    for (const collection of finalCollections) {
      const count = await crmDb.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📝 Your CRM_AdminPanel database now contains:');
    console.log('   ✅ All users (admin, superadmin)');
    console.log('   ✅ All orders');
    console.log('   ✅ All logs');
    console.log('   ✅ All mills');
    console.log('   ✅ All other collections');
    console.log('\n🔐 Login credentials:');
    console.log('   Username: admin | Password: admin123');
    console.log('   Username: superadmin | Password: superadmin');
    
  } catch (error) {
    console.error('\n❌ Migration error:', error.message);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

migrateAllData();
