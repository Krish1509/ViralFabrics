import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from '../models/Order';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/CRM_AdminPanel');

async function fixDuplicateOrders() {
  try {
    console.log('Starting to fix duplicate order numbers...');
    
    // Find all orders and sort by creation date
    const orders = await Order.find({}).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const expectedOrderId = `ORD-${(i + 1).toString().padStart(2, '0')}`;
      
      // Check if orderId needs to be updated
      if (order.orderId !== expectedOrderId) {
        console.log(`Fixing order ${order._id}: ${order.orderId} -> ${expectedOrderId}`);
        
        // Update both orderId and orderNo
        await Order.findByIdAndUpdate(order._id, {
          orderId: expectedOrderId,
          orderNo: expectedOrderId
        });
        
        updatedCount++;
      }
    }
    
    console.log(`Fixed ${updatedCount} orders`);
    console.log('Duplicate order number fix completed successfully!');
    
  } catch (error) {
    console.error('Error fixing duplicate orders:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixDuplicateOrders();
