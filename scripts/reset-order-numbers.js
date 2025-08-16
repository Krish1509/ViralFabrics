const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function resetOrderNumbers() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Define schemas inline to avoid import issues
    const CounterSchema = new mongoose.Schema({
      _id: {
        type: String,
        required: true
      },
      sequence: {
        type: Number,
        default: 0
      }
    });

    const OrderSchema = new mongoose.Schema({
      orderId: {
        type: String,
        unique: true,
        required: true,
      },
      orderType: {
        type: String,
        enum: ["Dying", "Printing"],
        required: true
      },
      arrivalDate: {
        type: Date,
        required: true
      },
      party: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Party",
        required: true
      },
      contactName: String,
      contactPhone: String,
      poNumber: String,
      styleNo: String,
      poDate: Date,
      deliveryDate: Date,
      items: [{
        quality: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Quality"
        },
        quantity: Number,
        imageUrl: String,
        description: String
      }]
    }, {
      timestamps: true
    });

    // Get models
    const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
    const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);

    // Get all orders sorted by creation date
    const orders = await Order.find({}).sort({ createdAt: 1 });
    console.log(`Found ${orders.length} orders to update`);

    if (orders.length === 0) {
      console.log('No orders found. Setting counter to 0.');
      await Counter.findByIdAndUpdate('orderId', { sequence: 0 }, { upsert: true });
      console.log('Counter initialized to 0');
      return;
    }

    // Reset counter to 0
    await Counter.findByIdAndUpdate('orderId', { sequence: 0 }, { upsert: true });
    console.log('Counter reset to 0');

    // Update each order with sequential number
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const newOrderId = (i + 1).toString().padStart(3, '0');
      
      console.log(`Updating order ${order._id} from "${order.orderId}" to "${newOrderId}"`);
      
      await Order.findByIdAndUpdate(order._id, { orderId: newOrderId });
    }

    // Set counter to the next number after the last order
    const nextNumber = orders.length + 1;
    await Counter.findByIdAndUpdate('orderId', { sequence: nextNumber }, { upsert: true });
    
    console.log(`Updated ${orders.length} orders with sequential numbers`);
    console.log(`Counter set to ${nextNumber} for next order`);
    console.log('Order numbering system reset successfully!');

  } catch (error) {
    console.error('Error resetting order numbers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
resetOrderNumbers();
