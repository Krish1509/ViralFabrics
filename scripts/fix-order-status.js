const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_admin');

// Import Order model
const Order = require('../models/Order').default;

async function fixOrderStatus() {
  try {
    console.log('Starting order status fix...');
    
    // Find all orders with old status values
    const ordersToUpdate = await Order.find({
      status: { $in: ['in_progress', 'completed', 'cancelled'] }
    });
    
    console.log(`Found ${ordersToUpdate.length} orders with old status values`);
    
    if (ordersToUpdate.length === 0) {
      console.log('No orders need to be updated');
      return;
    }
    
    // Update each order
    for (const order of ordersToUpdate) {
      let newStatus = 'pending'; // default
      
      // Map old statuses to new ones
      if (order.status === 'completed') {
        newStatus = 'delivered';
      } else if (order.status === 'in_progress') {
        newStatus = 'pending';
      } else if (order.status === 'cancelled') {
        newStatus = 'pending';
      }
      
      console.log(`Updating order ${order.orderId}: ${order.status} -> ${newStatus}`);
      
      await Order.findByIdAndUpdate(order._id, { status: newStatus });
    }
    
    console.log('Order status fix completed successfully!');
    
    // Verify the fix
    const remainingOldStatus = await Order.find({
      status: { $in: ['in_progress', 'completed', 'cancelled'] }
    });
    
    if (remainingOldStatus.length === 0) {
      console.log('✅ All orders now have valid status values');
    } else {
      console.log(`❌ ${remainingOldStatus.length} orders still have old status values`);
    }
    
  } catch (error) {
    console.error('Error fixing order status:', error);
  } finally {
    mongoose.disconnect();
  }
}

fixOrderStatus();
