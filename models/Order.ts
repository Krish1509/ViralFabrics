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
    index: true, // Primary lookup field
    required: true, // Ensure it's always present
  },
  // Add orderNo field for backward compatibility (auto-generated)
  orderNo: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
    index: true,
    required: false, // Make it optional to avoid validation errors
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
    required: [true, "Party is required"],
    index: true // For party-based queries
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
    maxlength: [50, "PO number cannot exceed 50 characters"],
    index: true // For PO-based searches
  },
  styleNo: {
    type: String,
    trim: true,
    maxlength: [50, "Style number cannot exceed 50 characters"],
    index: true // For style-based searches
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
    // Get the count of existing orders
    const count = await this.countDocuments();
    const nextNumber = count + 1;
    const orderId = `ORD-${nextNumber.toString().padStart(2, '0')}`; // ORD-01, ORD-02, etc.
    
    console.log(`Creating order with ID: ${orderId}`); // Debug log
    
    // Create the order with the generated ID
    const order = new this({
      ...orderData,
      orderId,
      orderNo: orderId
    });
    
    const savedOrder = await order.save();
    console.log(`Order created successfully with ID: ${savedOrder.orderId}`); // Debug log
    return savedOrder;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

// Pre-save middleware for auto-generating orderId and orderNo (fallback)
OrderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderId) {
    try {
      // Always generate a new orderId with ORD- prefix
      const count = await mongoose.model('Order').countDocuments();
      const nextNumber = count + 1;
      this.orderId = `ORD-${nextNumber.toString().padStart(2, '0')}`; // ORD-01, ORD-02, etc.
      this.orderNo = this.orderId; // Use the same format
      
      console.log(`Generated orderId: ${this.orderId}`); // Debug log
      
      next();
    } catch (error) {
      console.error('Error generating orderId:', error);
      // Fallback - use a simple increment
      const fallbackNumber = Date.now() % 1000;
      this.orderId = `ORD-${fallbackNumber.toString().padStart(2, '0')}`;
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
