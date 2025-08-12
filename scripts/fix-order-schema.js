const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error("Please add MONGODB_URI to .env");
    }
    
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const fixOrderSchema = async () => {
  try {
    await connectDB();
    
    const db = mongoose.connection.db;
    const collection = db.collection('orders');
    
    console.log('🔍 Checking existing indexes...');
    
    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(idx => idx.name));
    
    // Check if orderNo index exists
    const orderNoIndex = indexes.find(idx => idx.name === 'orderNo_1');
    
    if (orderNoIndex) {
      console.log('❌ Found old orderNo index, dropping it...');
      await collection.dropIndex('orderNo_1');
      console.log('✅ Dropped orderNo_1 index');
    } else {
      console.log('✅ No orderNo index found');
    }
    
    // Create new sparse orderNo index
    console.log('🔄 Creating new sparse orderNo index...');
    await collection.createIndex({ orderNo: 1 }, { unique: true, sparse: true });
    console.log('✅ Created orderNo_1 sparse index');
    
    // Check if there are any documents with orderNo field
    const docsWithOrderNo = await collection.countDocuments({ orderNo: { $exists: true } });
    
    if (docsWithOrderNo > 0) {
      console.log(`⚠️  Found ${docsWithOrderNo} documents with orderNo field`);
      console.log('🔄 Removing orderNo field from existing documents...');
      
      await collection.updateMany(
        { orderNo: { $exists: true } },
        { $unset: { orderNo: "" } }
      );
      
      console.log('✅ Removed orderNo field from existing documents');
    } else {
      console.log('✅ No documents with orderNo field found');
    }
    
    // Ensure orderId index exists
    const orderIdIndex = indexes.find(idx => idx.name === 'orderId_1');
    
    if (!orderIdIndex) {
      console.log('🔄 Creating orderId index...');
      await collection.createIndex({ orderId: 1 }, { unique: true });
      console.log('✅ Created orderId_1 index');
    } else {
      console.log('✅ orderId index already exists');
    }
    
    console.log('🎉 Schema migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the migration
fixOrderSchema();
