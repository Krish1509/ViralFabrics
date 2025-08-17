import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

interface Counter {
  _id: string;
  sequence: number;
}

interface OrderItem {
  quality: mongoose.Types.ObjectId;
  quantity: number;
  imageUrl?: string;
  description?: string;
}

interface Order {
  _id: mongoose.Types.ObjectId;
  orderId: string;
  orderType: 'Dying' | 'Printing';
  arrivalDate: Date;
  party: mongoose.Types.ObjectId;
  contactName?: string;
  contactPhone?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: Date;
  deliveryDate?: Date;
  items: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

async function resetOrderNumbers(): Promise<void> {
  try {
    console.log('Connecting to database...');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Define schemas inline to avoid import issues
    const CounterSchema = new mongoose.Schema<Counter>({
      _id: {
        type: String,
        required: true
      },
      sequence: {
        type: Number,
        default: 0
      }
    });

    const OrderSchema = new mongoose.Schema<Order>({
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
    const Order = mongoose.models.Order || mongoose.model<Order>('Order', OrderSchema);
    const Counter = mongoose.models.Counter || mongoose.model<Counter>('Counter', CounterSchema);

    // Get all orders sorted by creation date
    const orders: Order[] = await Order.find({}).sort({ createdAt: 1 });
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
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the script
if (require.main === module) {
  resetOrderNumbers()
    .then(() => {
      console.log('🎉 Order numbering reset completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Order numbering reset failed:', error);
      process.exit(1);
    });
}

export { resetOrderNumbers };
