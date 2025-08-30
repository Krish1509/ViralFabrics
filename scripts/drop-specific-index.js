const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function dropSpecificIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('fabrics');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:');
    indexes.forEach(idx => {
      console.log(`- ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Drop the specific problematic index
    const targetIndexName = 'qualityCode_1_weaver_1_weaverQualityName_1';
    
    if (indexes.find(idx => idx.name === targetIndexName)) {
      console.log(`\nDropping index: ${targetIndexName}`);
      await collection.dropIndex(targetIndexName);
      console.log(`Successfully dropped index: ${targetIndexName}`);
    } else {
      console.log(`\nIndex ${targetIndexName} not found`);
    }

    // Also drop any other compound indexes that might cause issues
    const compoundIndexes = indexes.filter(idx => 
      idx.name !== '_id_' && 
      Object.keys(idx.key).length > 1
    );

    for (const index of compoundIndexes) {
      console.log(`\nDropping compound index: ${index.name}`);
      try {
        await collection.dropIndex(index.name);
        console.log(`Successfully dropped index: ${index.name}`);
      } catch (error) {
        console.log(`Error dropping index ${index.name}:`, error.message);
      }
    }

    console.log('\nIndex cleanup completed');
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropSpecificIndex();
