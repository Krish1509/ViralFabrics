import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/CRM_AdminPanel';

interface IndexInfo {
  name?: string;
  key: Record<string, any>;
}

async function fixOrderIndexes(): Promise<void> {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed - db is undefined');
    }
    const collection = db.collection('orders');

    console.log('Dropping problematic indexes...');

    // Drop indexes that might cause unique constraint issues
    const indexesToDrop: string[] = [
      'party_1_poNumber_1_styleNo_1',
      'poNumber_1_styleNo_1',
      'orderNo_1',
      'orderId_1_orderNo_1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✓ Dropped index: ${indexName}`);
      } catch (error) {
        console.log(`Index ${indexName} not found or already dropped`);
      }
    }

    // List remaining indexes
    console.log('\nRemaining indexes:');
    const indexes: IndexInfo[] = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name || 'unnamed'}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Order indexes fixed successfully!');
    console.log('You can now create orders with duplicate PO numbers and style numbers.');

  } catch (error) {
    console.error('Error fixing order indexes:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  fixOrderIndexes()
    .then(() => {
      console.log('🎉 Order indexes fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Order indexes fix failed:', error);
      process.exit(1);
    });
}

export { fixOrderIndexes };
