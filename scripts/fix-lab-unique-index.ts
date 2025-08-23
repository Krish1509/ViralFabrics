import dbConnect from '../lib/dbConnect';
import mongoose from 'mongoose';

async function fixLabUniqueIndex() {
  try {
    await dbConnect();
    console.log('🔗 Connected to database');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const labCollection = db.collection('labs');

    console.log('📊 Analyzing current lab indexes...');
    
    // Get all indexes
    const indexes = await labCollection.indexes();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));

    // Find the problematic unique index
    const uniqueOrderItemIndex = indexes.find(idx => 
      idx.key && 
      idx.key.order === 1 && 
      idx.key.orderItemId === 1 && 
      idx.unique === true
    );

    if (uniqueOrderItemIndex && uniqueOrderItemIndex.name) {
      console.log('🔧 Found unique index to remove:', uniqueOrderItemIndex.name);
      
      // Drop the unique index
      await labCollection.dropIndex(uniqueOrderItemIndex.name);
      console.log('✅ Dropped unique index:', uniqueOrderItemIndex.name);
      
      // Recreate as non-unique index
      await labCollection.createIndex(
        { order: 1, orderItemId: 1 },
        { name: 'idx_lab_order_item', unique: false }
      );
      console.log('✅ Recreated as non-unique index: idx_lab_order_item');
    } else {
      console.log('✅ No unique order_orderItemId index found');
    }

    // Verify the fix
    const updatedIndexes = await labCollection.indexes();
    console.log('Updated indexes:', updatedIndexes.map(idx => ({ name: idx.name, key: idx.key, unique: idx.unique })));

    console.log('🎉 Lab unique index fix completed!');

  } catch (error) {
    console.error('❌ Error fixing lab unique index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the fix
fixLabUniqueIndex();
