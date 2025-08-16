const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

// Define the Order schema inline to avoid import issues
const orderSchema = new mongoose.Schema({
  orderId: String,
  items: [{
    imageUrl: String,
    imageUrls: [String],
    quality: mongoose.Schema.Types.ObjectId,
    quantity: Number,
    description: String
  }]
}, { strict: false });

const Order = mongoose.model('Order', orderSchema);

async function migrateImageUrls() {
  try {
    console.log('Starting image URL migration...');
    
    // Find all orders that have imageUrl field in items
    const orders = await Order.find({
      'items.imageUrl': { $exists: true }
    });
    
    console.log(`Found ${orders.length} orders with old imageUrl format`);
    
    for (const order of orders) {
      console.log(`Processing order ${order.orderId}...`);
      
      let hasChanges = false;
      
      // Update each item in the order
      for (const item of order.items) {
        if (item.imageUrl && !item.imageUrls) {
          // Convert single imageUrl to imageUrls array
          item.imageUrls = [item.imageUrl];
          delete item.imageUrl;
          hasChanges = true;
          console.log(`  - Converted imageUrl to imageUrls for item`);
        }
      }
      
      if (hasChanges) {
        // Save the updated order
        await order.save();
        console.log(`  - Saved order ${order.orderId}`);
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the migration
    const ordersWithOldFormat = await Order.find({
      'items.imageUrl': { $exists: true }
    });
    
    const ordersWithNewFormat = await Order.find({
      'items.imageUrls': { $exists: true }
    });
    
    console.log(`Orders with old format: ${ordersWithOldFormat.length}`);
    console.log(`Orders with new format: ${ordersWithNewFormat.length}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    mongoose.disconnect();
  }
}

migrateImageUrls();
