const mongoose = require('mongoose');

async function dropFabricIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('fabrics');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Drop all indexes except _id
    for (const index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index: ${index.name}`);
        try {
          await collection.dropIndex(index.name);
          console.log(`Successfully dropped index: ${index.name}`);
        } catch (error) {
          console.log(`Error dropping index ${index.name}:`, error.message);
        }
      }
    }

    console.log('Index cleanup completed');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropFabricIndexes();
