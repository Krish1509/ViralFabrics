const mongoose = require('mongoose');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/CRM_AdminPanel';

async function fixOrderIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    const db = mongoose.connection.db;
    const collection = db.collection('orders');

    console.log('Dropping problematic indexes...');

    // Drop indexes that might cause unique constraint issues
    try {
      await collection.dropIndex('party_1_poNumber_1_styleNo_1');
      console.log('✓ Dropped index: party_1_poNumber_1_styleNo_1');
    } catch (error) {
      console.log('Index party_1_poNumber_1_styleNo_1 not found or already dropped');
    }

    try {
      await collection.dropIndex('poNumber_1_styleNo_1');
      console.log('✓ Dropped index: poNumber_1_styleNo_1');
    } catch (error) {
      console.log('Index poNumber_1_styleNo_1 not found or already dropped');
    }

    try {
      await collection.dropIndex('orderNo_1');
      console.log('✓ Dropped index: orderNo_1');
    } catch (error) {
      console.log('Index orderNo_1 not found or already dropped');
    }

    try {
      await collection.dropIndex('orderId_1_orderNo_1');
      console.log('✓ Dropped index: orderId_1_orderNo_1');
    } catch (error) {
      console.log('Index orderId_1_orderNo_1 not found or already dropped');
    }

    // List remaining indexes
    console.log('\nRemaining indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Order indexes fixed successfully!');
    console.log('You can now create orders with duplicate PO numbers and style numbers.');

  } catch (error) {
    console.error('Error fixing order indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
fixOrderIndexes();
