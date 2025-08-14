import mongoose, { Document, Schema } from "mongoose";

// Order Item interface
export interface IOrderItem {
  quality?: mongoose.Types.ObjectId;
  quantity?: number;
  imageUrl?: string;
  description?: string;
}

// TypeScript interface for better type safety
export interface IOrder extends Document {
  orderId: string;
  orderNo?: string; // Optional for backward compatibility
  orderType: "Dying" | "Printing";
  arrivalDate: Date;
  party: mongoose.Types.ObjectId;
  contactName?: string;
  contactPhone?: string;
  poNumber?: string;
  styleNo?: string;
  poDate?: Date;
  deliveryDate?: Date;
  items: IOrderItem[]; // Multiple order items
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
    required: true, // Ensure it's always present
  },
  // Add orderNo field for backward compatibility (auto-generated)
  orderNo: {
    type: String,
    required: false, // Make it optional to avoid validation errors
    default: undefined // Ensure it's not null by default
  },
  orderType: {
    type: String,
    enum: {
      values: ["Dying", "Printing"],
      message: "Order type must be either 'Dying' or 'Printing'"
    },
    required: [true, "Order type is required"]
  },
  arrivalDate: {
    type: Date,
    required: [true, "Arrival date is required"]
  },
  party: {
    type: Schema.Types.ObjectId,
    ref: "Party",
    required: [true, "Party is required"]
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
      imageUrl: {
        type: String,
        trim: true,
        maxlength: [500, "Image URL cannot exceed 500 characters"]
      },
      description: {
        type: String,
        trim: true,
        maxlength: [200, "Description cannot exceed 200 characters"]
      }
    }],
    default: [],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: "Order must contain at least one item"
    }
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
OrderSchema.index({ orderId: 1 }); // Primary lookup
OrderSchema.index({ orderNo: 1 }); // Order number lookup (non-unique)
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
OrderSchema.index({ poNumber: 1, styleNo: 1 }); // PO and style combination
OrderSchema.index({ arrivalDate: 1, deliveryDate: 1 }); // Date range queries
// Unique compound index to prevent duplicate PO + Style for same party
OrderSchema.index({ party: 1, poNumber: 1, styleNo: 1 }, { unique: true, sparse: true });

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

// Static method to create order with proper ID
OrderSchema.statics.createOrder = async function(orderData: any) {
  try {
    // Generate a unique order ID with retry logic
    let orderId: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      attempts++;
      // Use timestamp + random number to ensure uniqueness
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      orderId = `ORD-${timestamp}-${random}`;
      
      // Check if this ID already exists
      const existingOrder = await this.findOne({ orderId });
      if (!existingOrder) {
        break;
      }
      
      // If we've tried too many times, throw an error
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique order ID after multiple attempts');
      }
      
      // Small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 1));
      
    } while (true);
    
    console.log(`Creating order with ID: ${orderId} (attempt ${attempts})`);
    
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

// Pre-save middleware for auto-generating orderId and orderNo (fallback only)
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    try {
      // Simple fallback - use timestamp + random to ensure uniqueness
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.orderId = `ORD-${timestamp}-${random}`;
      this.orderNo = this.orderId;
      
      console.log(`Fallback generated orderId: ${this.orderId}`);
      
      next();
    } catch (error) {
      console.error('Error in fallback orderId generation:', error);
      // Final fallback
      const fallbackNumber = Date.now();
      const random = Math.floor(Math.random() * 1000);
      this.orderId = `ORD-${fallbackNumber}-${random}`;
      this.orderNo = this.orderId;
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

// Virtual for order status based on dates
OrderSchema.virtual('status').get(function() {
  const now = new Date();
  if (this.deliveryDate && now > this.deliveryDate) {
    return 'Delivered';
  } else if (this.arrivalDate && now > this.arrivalDate) {
    return 'Arrived';
  } else {
    return 'Pending';
  }
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
