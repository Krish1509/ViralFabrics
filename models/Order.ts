import mongoose, { Document, Schema } from "mongoose";
import Counter from "./Counter";

// Order Item interface
export interface IOrderItem {
  quality?: mongoose.Types.ObjectId;
  quantity?: number;
  imageUrls?: string[];
  description?: string;
}

// TypeScript interface for better type safety
export interface IOrder extends Document {
  orderId: string; // Simple sequential number like "001", "002", etc.
  orderType?: "Dying" | "Printing";
  arrivalDate?: Date;
  party?: mongoose.Types.ObjectId;
  contactName?: string;
  contactPhone?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: Date;
  deliveryDate?: Date;
  items: IOrderItem[]; // Multiple order items
  status?: "pending" | "delivered";
  labData?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
export interface IOrderModel extends mongoose.Model<IOrder> {
  createOrder(orderData: any): Promise<IOrder>;
  findByOrderId(orderId: string): Promise<IOrder | null>;
  findByParty(partyId: string): Promise<IOrder[]>;
  findByPoNumber(poNumber: string): Promise<IOrder[]>;
  findByStyleNo(styleNo: string): Promise<IOrder[]>;
  findByOrderType(orderType: "Dying" | "Printing"): Promise<IOrder[]>;
  searchOrders(searchTerm: string): Promise<IOrder[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IOrder[]>;
}

const OrderSchema = new Schema<IOrder>({
  orderId: {
    type: String,
    unique: true,
    required: true,
  },
  orderType: {
    type: String,
    enum: {
      values: ["Dying", "Printing"],
      message: "Order type must be either 'Dying' or 'Printing'"
    }
  },
  arrivalDate: {
    type: Date
  },
  party: {
    type: Schema.Types.ObjectId,
    ref: "Party"
  },
  contactName: {
    type: String,
    trim: true,
    maxlength: [50, "Contact name cannot exceed 50 characters"]
  },
  contactPhone: {
    type: String,
    trim: true,
    maxlength: [20, "Contact phone cannot exceed 20 characters"]
  },
  poNumber: {
    type: String,
    trim: true,
    maxlength: [50, "PO number cannot exceed 50 characters"]
  },
  styleNo: {
    type: String,
    trim: true,
    maxlength: [50, "Style number cannot exceed 50 characters"]
  },
  poDate: {
    type: Date
  },
  deliveryDate: {
    type: Date
  },
  items: {
    type: [{
      quality: {
        type: Schema.Types.ObjectId,
        ref: "Quality"
      },
      quantity: {
        type: Number,
        min: [0, "Quantity cannot be negative"]
      },
      imageUrls: {
        type: [String],
        default: [],
        validate: {
          validator: function(v: string[]) {
            return v.every(url => url.length <= 500);
          },
          message: "Each image URL cannot exceed 500 characters"
        }
      },
      description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
      }
    }],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "delivered"],
      message: "Status must be one of: pending, delivered"
    },
    default: "pending"
  },
  labData: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  // Optimize JSON serialization
  toJSON: {
    transform: function(doc, ret: any) {
      return ret;
    },
    virtuals: true
  },
  toObject: {
    transform: function(doc, ret: any) {
      return ret;
    },
    virtuals: true
  }
});

// **CRITICAL INDEXES FOR PERFORMANCE**
// Single field indexes
OrderSchema.index({ party: 1 }); // Party-based queries
OrderSchema.index({ poNumber: 1 }); // PO-based searches
OrderSchema.index({ styleNo: 1 }); // Style-based searches
OrderSchema.index({ orderType: 1 }); // Type-based filtering
OrderSchema.index({ arrivalDate: -1 }); // Date-based sorting
OrderSchema.index({ createdAt: -1 }); // Recent orders
OrderSchema.index({ deliveryDate: -1 }); // Delivery date sorting

// Compound indexes for common query patterns
OrderSchema.index({ party: 1, createdAt: -1 }); // Party orders with date sorting
OrderSchema.index({ orderType: 1, arrivalDate: -1 }); // Type and date filtering
OrderSchema.index({ party: 1, orderType: 1 }); // Party and type filtering
// Removed PO + Style combination index to allow duplicates
OrderSchema.index({ arrivalDate: 1, deliveryDate: 1 }); // Date range queries
// Removed compound index for PO + Style combination to allow duplicates

// Text index for search functionality
OrderSchema.index({ 
  poNumber: "text", 
  styleNo: "text"
}, {
  weights: {
    poNumber: 2,
    styleNo: 2
  }
});

// Static method to create order with sequential ID
OrderSchema.statics.createOrder = async function(orderData: any) {
  try {
    // Get next sequential order number
    const nextNumber = await (Counter as any).getNextSequence('orderId');
    
    // Format as 3-digit number (001, 002, 003, etc.)
    const orderId = nextNumber.toString().padStart(3, '0');
    
    console.log(`Creating order with ID: ${orderId}`);
    
    // Create the order with the generated ID
    const order = new this({
      ...orderData,
      orderId
    });
    
    const savedOrder = await order.save();
    console.log(`Order created successfully with ID: ${savedOrder.orderId}`);
    return savedOrder;
    
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Pre-save middleware for auto-generating orderId (fallback only)
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    try {
      // Get next sequential order number
      const nextNumber = await (Counter as any).getNextSequence('orderId');
      const orderId = nextNumber.toString().padStart(3, '0');
      
      this.orderId = orderId;
      console.log(`Fallback generated orderId: ${this.orderId}`);
      
      next();
    } catch (error) {
      console.error('Error in fallback orderId generation:', error);
      // Final fallback - use timestamp as last resort
      const fallbackNumber = Date.now() % 1000; // Use last 3 digits
      this.orderId = fallbackNumber.toString().padStart(3, '0');
      next();
    }
  } else {
    next();
  }
});

// Static methods for common queries
OrderSchema.statics.findByOrderId = function(orderId: string) {
  return this.findOne({ orderId }).populate('party').populate('items.quality');
};

OrderSchema.statics.findByParty = function(partyId: string) {
  return this.find({ party: partyId }).populate('party').populate('items.quality').sort({ createdAt: -1 });
};

OrderSchema.statics.findByPoNumber = function(poNumber: string) {
  return this.find({ poNumber: { $regex: poNumber, $options: 'i' } }).populate('party').populate('items.quality');
};

OrderSchema.statics.findByStyleNo = function(styleNo: string) {
  return this.find({ styleNo: { $regex: styleNo, $options: 'i' } }).populate('party').populate('items.quality');
};

OrderSchema.statics.findByOrderType = function(orderType: "Dying" | "Printing") {
  return this.find({ orderType }).populate('party').populate('items.quality').sort({ createdAt: -1 });
};

OrderSchema.statics.searchOrders = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }).populate('party').populate('items.quality').sort({ score: { $meta: "textScore" } });
};

OrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    arrivalDate: {
      $gte: startDate,
      $lte: endDate
    }
  }).populate('party').populate('items.quality').sort({ arrivalDate: -1 });
};

// Virtual for order's full info with populated party
OrderSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    orderId: this.orderId,
    orderType: this.orderType,
    arrivalDate: this.arrivalDate,
    party: this.party,
    contactName: this.contactName,
    contactPhone: this.contactPhone,
    poNumber: this.poNumber,
    styleNo: this.styleNo,
    poDate: this.poDate,
    deliveryDate: this.deliveryDate,
    items: this.items,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});



// Error handling middleware
OrderSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`${field} already exists`));
  } else {
    next(error);
  }
});

// Create and export the model
const Order = mongoose.models.Order || mongoose.model<IOrder, IOrderModel>("Order", OrderSchema);

export default Order;
