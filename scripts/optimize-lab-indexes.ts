import dbConnect from '../lib/dbConnect';
import mongoose from 'mongoose';

async function optimizeLabIndexes() {
  try {
    await dbConnect();
    console.log('🔗 Connected to database');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const labCollection = db.collection('labs');

    console.log('📊 Analyzing current lab indexes...');
    
    // Get current indexes
    const currentIndexes = await labCollection.indexes();
    console.log('Current indexes:', currentIndexes.map(idx => idx.name));

    // Drop existing indexes (except _id)
    console.log('🗑️ Dropping existing indexes...');
    for (const index of currentIndexes) {
      if (index.name !== '_id_') {
        await labCollection.dropIndex(index.name as string);
        console.log(`Dropped index: ${index.name}`);
      }
    }

    // Create optimized indexes for labs
    console.log('🔧 Creating optimized lab indexes...');
    
    // Primary compound index for order labs (most common query)
    await labCollection.createIndex(
      { order: 1, softDeleted: 1, createdAt: -1 },
      { name: 'order_softDeleted_createdAt' }
    );
    console.log('✅ Created: order_softDeleted_createdAt');

    // Index for order item queries
    await labCollection.createIndex(
      { order: 1, orderItemId: 1, softDeleted: 1 },
      { name: 'order_orderItemId_softDeleted' }
    );
    console.log('✅ Created: order_orderItemId_softDeleted');

    // Index for status-based queries
    await labCollection.createIndex(
      { status: 1, softDeleted: 1, createdAt: -1 },
      { name: 'status_softDeleted_createdAt' }
    );
    console.log('✅ Created: status_softDeleted_createdAt');

    // Index for lab send number searches
    await labCollection.createIndex(
      { labSendNumber: 1, softDeleted: 1 },
      { name: 'labSendNumber_softDeleted' }
    );
    console.log('✅ Created: labSendNumber_softDeleted');

    // Index for date range queries
    await labCollection.createIndex(
      { labSendDate: -1, softDeleted: 1 },
      { name: 'labSendDate_softDeleted' }
    );
    console.log('✅ Created: labSendDate_softDeleted');

    // Index for priority and urgency
    await labCollection.createIndex(
      { priority: -1, urgency: 1, softDeleted: 1 },
      { name: 'priority_urgency_softDeleted' }
    );
    console.log('✅ Created: priority_urgency_softDeleted');

    // Text search index
    await labCollection.createIndex(
      { 
        labSendNumber: "text",
        remarks: "text"
      },
      {
        weights: {
          labSendNumber: 10,
          remarks: 5
        },
        name: "lab_text_search"
      }
    );
    console.log('✅ Created: lab_text_search');

    // General timestamp index
    await labCollection.createIndex(
      { createdAt: -1 },
      { name: 'createdAt_desc' }
    );
    console.log('✅ Created: createdAt_desc');

    console.log('🎉 All lab indexes created successfully!');
    
    // Show final index list
    const finalIndexes = await labCollection.indexes();
    console.log('\n📋 Final lab index list:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

  } catch (error) {
    console.error('❌ Error optimizing lab indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the optimization
optimizeLabIndexes();
