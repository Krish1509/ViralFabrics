const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function fixOrderSchema() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Get the database instance
    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    console.log('Checking existing indexes...');
    
    // Get all indexes
    const indexes = await ordersCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));

    // Remove problematic indexes
    const indexesToRemove = ['orderNo_1', 'orderId_1_orderNo_1'];
    
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
        console.log(`Error removing index ${indexName}:`, error.message);
      }
    }

    // Update all existing orders to remove orderNo field
    console.log('Updating existing orders to remove orderNo field...');
    const updateResult = await ordersCollection.updateMany(
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
      console.log('Error creating orderId index:', error.message);
    }

    // Create other necessary indexes
    const newIndexes = [
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
        console.log(`Error creating index ${JSON.stringify(indexSpec)}:`, error.message);
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
      console.log('Error creating text index:', error.message);
    }

    console.log('Order schema fix completed successfully!');
    console.log('You can now restart your application.');

  } catch (error) {
    console.error('Error fixing order schema:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
fixOrderSchema();
