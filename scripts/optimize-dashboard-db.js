const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define Order schema directly for optimization
const OrderSchema = new mongoose.Schema({
  orderId: String,
  orderType: String,
  status: String,
  party: mongoose.Schema.Types.ObjectId,
  financialYear: String,
  createdAt: Date,
  updatedAt: Date,
  // Add other fields as needed
}, { collection: 'orders' });

const Order = mongoose.model('Order', OrderSchema);

async function optimizeDashboardDatabase() {
  try {
    console.log('🚀 Starting dashboard database optimization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB');

    // Create indexes for faster dashboard queries
    console.log('📊 Creating indexes for dashboard optimization...');
    
    const indexesToCreate = [
      { key: { status: 1 }, name: 'status_1', description: 'status field' },
      { key: { orderType: 1 }, name: 'orderType_1', description: 'orderType field' },
      { key: { status: 1, orderType: 1 }, name: 'status_1_orderType_1', description: 'status + orderType' },
      { key: { createdAt: -1 }, name: 'createdAt_-1', description: 'createdAt field' },
      { key: { updatedAt: -1 }, name: 'updatedAt_-1', description: 'updatedAt field' },
      { key: { status: 1, createdAt: -1 }, name: 'status_1_createdAt_-1', description: 'status + createdAt' },
      { key: { party: 1 }, name: 'party_1', description: 'party field' },
      { key: { financialYear: 1 }, name: 'financialYear_1', description: 'financialYear field' }
    ];

    for (const indexSpec of indexesToCreate) {
      try {
        await Order.collection.createIndex(indexSpec.key, { 
          name: indexSpec.name,
          background: true 
        });
        console.log(`✅ Created index on ${indexSpec.description}`);
      } catch (error) {
        if (error.code === 85 || error.message?.includes('already exists')) {
          console.log(`⚠️  Index on ${indexSpec.description} already exists, skipping...`);
        } else {
          console.log(`❌ Failed to create index on ${indexSpec.description}:`, error.message);
        }
      }
    }

    // Get collection stats
    try {
      const stats = await Order.collection.stats();
      console.log('📈 Collection statistics:');
      console.log(`   - Total documents: ${stats.count}`);
      console.log(`   - Average document size: ${Math.round(stats.avgObjSize)} bytes`);
      console.log(`   - Total collection size: ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
      console.log(`   - Total indexes: ${stats.nindexes}`);
      console.log(`   - Total index size: ${Math.round(stats.totalIndexSize / 1024 / 1024 * 100) / 100} MB`);
    } catch (statsError) {
      console.log('⚠️  Could not retrieve collection stats:', statsError.message);
    }

    // List all indexes
    try {
      const indexes = await Order.collection.listIndexes().toArray();
      console.log('📋 Current indexes:');
      indexes.forEach(index => {
        console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`);
      });
    } catch (indexError) {
      console.log('⚠️  Could not list indexes:', indexError.message);
    }

    console.log('🎉 Dashboard database optimization completed successfully!');
    console.log('💡 These indexes will significantly improve dashboard query performance');

  } catch (error) {
    console.error('❌ Error optimizing dashboard database:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the optimization
if (require.main === module) {
  optimizeDashboardDatabase()
    .then(() => {
      console.log('✅ Dashboard optimization script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dashboard optimization script failed:', error);
      process.exit(1);
    });
}

module.exports = optimizeDashboardDatabase;
