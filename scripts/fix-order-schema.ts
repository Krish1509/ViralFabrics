import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface IndexInfo {
  name?: string;
  key: Record<string, any>;
}

interface UpdateResult {
  modifiedCount: number;
}

interface IndexSpec {
  [key: string]: number;
}

async function fixOrderSchema(): Promise<void> {
  try {
    console.log('Connecting to database...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Get the database instance
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection failed - db is undefined');
    }
    const ordersCollection = db.collection('orders');

    console.log('Checking existing indexes...');
    
    // Get all indexes
    const indexes: IndexInfo[] = await ordersCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name || 'unnamed'));

    // Remove problematic indexes
    const indexesToRemove: string[] = ['orderNo_1', 'orderId_1_orderNo_1'];
    
    for (const indexName of indexesToRemove) {
      try {
        const indexExists = indexes.find(idx => idx.name === indexName);
        if (indexExists) {
          console.log(`Removing index: ${indexName}`);
          await ordersCollection.dropIndex(indexName);
          console.log(`Successfully removed index: ${indexName}`);
        } else {
          console.log(`Index ${indexName} does not exist, skipping...`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Error removing index ${indexName}:`, errorMessage);
      }
    }

    // Update all existing orders to remove orderNo field
    console.log('Updating existing orders to remove orderNo field...');
    const updateResult: UpdateResult = await ordersCollection.updateMany(
      {}, // Update all documents
      { $unset: { orderNo: "" } } // Remove orderNo field
    );
    console.log(`Updated ${updateResult.modifiedCount} orders`);

    // Create new indexes
    console.log('Creating new indexes...');
    
    // Create orderId index
    try {
      await ordersCollection.createIndex({ orderId: 1 }, { unique: true });
      console.log('Created orderId index');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error creating orderId index:', errorMessage);
    }

    // Create other necessary indexes
    const newIndexes: IndexSpec[] = [
      { party: 1 },
      { poNumber: 1 },
      { styleNo: 1 },
      { orderType: 1 },
      { arrivalDate: -1 },
      { createdAt: -1 },
      { deliveryDate: -1 },
      { party: 1, createdAt: -1 },
      { orderType: 1, arrivalDate: -1 },
      { party: 1, orderType: 1 },
      { poNumber: 1, styleNo: 1 },
      { arrivalDate: 1, deliveryDate: 1 },
      { party: 1, poNumber: 1, styleNo: 1 }
    ];

    for (const indexSpec of newIndexes) {
      try {
        const indexName = Object.keys(indexSpec).map(key => `${key}_${indexSpec[key]}`).join('_');
        await ordersCollection.createIndex(indexSpec);
        console.log(`Created index: ${indexName}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Error creating index ${JSON.stringify(indexSpec)}:`, errorMessage);
      }
    }

    // Create text index
    try {
      await ordersCollection.createIndex(
        { poNumber: "text", styleNo: "text" },
        {
          weights: {
            poNumber: 2,
            styleNo: 2
          }
        }
      );
      console.log('Created text index');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log('Error creating text index:', errorMessage);
    }

    console.log('Order schema fix completed successfully!');
    console.log('You can now restart your application.');

  } catch (error) {
    console.error('Error fixing order schema:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  fixOrderSchema()
    .then(() => {
      console.log('🎉 Order schema fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Order schema fix failed:', error);
      process.exit(1);
    });
}

export { fixOrderSchema };
