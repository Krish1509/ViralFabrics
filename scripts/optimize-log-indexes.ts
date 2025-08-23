import dbConnect from '../lib/dbConnect';
import mongoose from 'mongoose';

async function optimizeLogIndexes() {
  try {
    await dbConnect();
    console.log('🔗 Connected to database');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const logCollection = db.collection('logs');

    console.log('📊 Analyzing current indexes...');
    
    // Get current indexes
    const currentIndexes = await logCollection.indexes();
    console.log('Current indexes:', currentIndexes.map(idx => idx.name));

    // Drop existing indexes (except _id)
    console.log('🗑️ Dropping existing indexes...');
    for (const index of currentIndexes) {
      if (index.name !== '_id_') {
        await logCollection.dropIndex(index.name as string);
        console.log(`Dropped index: ${index.name}`);
      }
    }

    // Create optimized indexes
    console.log('🔧 Creating optimized indexes...');
    
    // Primary compound index for order logs (most common query)
    await logCollection.createIndex(
      { resource: 1, resourceId: 1, timestamp: -1 },
      { name: 'resource_resourceId_timestamp' }
    );
    console.log('✅ Created: resource_resourceId_timestamp');

    // Index for user activity
    await logCollection.createIndex(
      { userId: 1, timestamp: -1 },
      { name: 'userId_timestamp' }
    );
    console.log('✅ Created: userId_timestamp');

    // Index for action-based queries
    await logCollection.createIndex(
      { action: 1, timestamp: -1 },
      { name: 'action_timestamp' }
    );
    console.log('✅ Created: action_timestamp');

    // Index for resource-based queries
    await logCollection.createIndex(
      { resource: 1, timestamp: -1 },
      { name: 'resource_timestamp' }
    );
    console.log('✅ Created: resource_timestamp');

    // Index for success/failure queries
    await logCollection.createIndex(
      { success: 1, timestamp: -1 },
      { name: 'success_timestamp' }
    );
    console.log('✅ Created: success_timestamp');

    // Index for severity-based queries
    await logCollection.createIndex(
      { severity: 1, timestamp: -1 },
      { name: 'severity_timestamp' }
    );
    console.log('✅ Created: severity_timestamp');

    // Compound index for user activity by resource
    await logCollection.createIndex(
      { userId: 1, resource: 1, timestamp: -1 },
      { name: 'userId_resource_timestamp' }
    );
    console.log('✅ Created: userId_resource_timestamp');

    // Compound index for resource-specific actions
    await logCollection.createIndex(
      { resource: 1, action: 1, timestamp: -1 },
      { name: 'resource_action_timestamp' }
    );
    console.log('✅ Created: resource_action_timestamp');

    // General timestamp index for date range queries
    await logCollection.createIndex(
      { timestamp: -1 },
      { name: 'timestamp_desc' }
    );
    console.log('✅ Created: timestamp_desc');

    console.log('🎉 All indexes created successfully!');
    
    // Show final index list
    const finalIndexes = await logCollection.indexes();
    console.log('\n📋 Final index list:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

  } catch (error) {
    console.error('❌ Error optimizing indexes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run the optimization
optimizeLogIndexes();
