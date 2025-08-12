import mongoose, { Document, Schema } from "mongoose";

// TypeScript interfaces for better type safety
export interface IOrderItem {
  quality: string;
  quantity: number;
  image: string;
  _id?: mongoose.Types.ObjectId;
}

export interface IOrder extends Document {
  orderNo: string;
  date: Date;
  party: string;
  name: string;
  contactNumber: string;
  poNo: string;
  styleNo: string;
  poDate: Date;
  deliveryDate: Date;
  items: IOrderItem[];
  status: "pending" | "confirmed" | "in_production" | "ready" | "delivered" | "cancelled";
  totalQuantity: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  calculateTotalQuantity(): number;
  updateStatus(newStatus: string): Promise<void>;
}

// Validation functions
const validateContactNumber = (phone: string) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

const validateImageUrl = (url: string) => {
  if (!url) return true; // Allow empty for optional images
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  const filePathRegex = /^[\/\\]?[\w\-\/\\]+\.(jpg|jpeg|png|gif|webp)$/i;
  return urlRegex.test(url) || filePathRegex.test(url);
};

// Order Item Schema (Embedded Subdocument)
const OrderItemSchema = new Schema<IOrderItem>({
  quality: {
    type: String,
    required: [true, "Quality is required"],
    trim: true,
    enum: {
      values: ["Cotton", "Silk", "Polyester", "Wool", "Linen", "Denim", "Other"],
      message: "Quality must be one of: Cotton, Silk, Polyester, Wool, Linen, Denim, Other"
    }
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    max: [999999, "Quantity cannot exceed 999,999"]
  },
  image: {
    type: String,
    trim: true,
    validate: {
      validator: validateImageUrl,
      message: "Please provide a valid image URL or file path"
    }
  }
}, {
  _id: true, // Enable _id for individual item operations
  timestamps: false // No timestamps for embedded documents
});

// Main Order Schema
const OrderSchema = new Schema<IOrder>({
  orderNo: {
    type: String,
    unique: true,
    required: [true, "Order number is required"],
    trim: true,
    uppercase: true,
    match: [/^[A-Z0-9\-_]+$/, "Order number can only contain uppercase letters, numbers, hyphens, and underscores"],
    index: true // Primary lookup field
  },
  date: {
    type: Date,
    required: [true, "Order date is required"],
    default: Date.now,
    index: true // For date-based queries
  },
  party: {
    type: String,
    required: [true, "Party code is required"],
    trim: true,
    uppercase: true,
    minlength: [2, "Party code must be at least 2 characters"],
    maxlength: [10, "Party code cannot exceed 10 characters"],
    index: true // For party-based filtering
  },
  name: {
    type: String,
    required: [true, "Contact person name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [100, "Name cannot exceed 100 characters"],
    index: true // For name-based searches
  },
  contactNumber: {
    type: String,
    required: [true, "Contact number is required"],
    trim: true,
    validate: {
      validator: validateContactNumber,
      message: "Please provide a valid contact number"
    }
  },
  poNo: {
    type: String,
    required: [true, "Purchase order number is required"],
    trim: true,
    uppercase: true,
    index: true // For PO-based lookups
  },
  styleNo: {
    type: String,
    required: [true, "Style number is required"],
    trim: true,
    uppercase: true,
    index: true // For style-based searches
  },
  poDate: {
    type: Date,
    required: [true, "PO date is required"],
    index: true // For PO date filtering
  },
  deliveryDate: {
    type: Date,
    required: [true, "Delivery date is required"],
    index: true // For delivery date filtering
  },
  items: {
    type: [OrderItemSchema],
    required: [true, "At least one item is required"],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: "Order must contain at least one item"
    }
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "confirmed", "in_production", "ready", "delivered", "cancelled"],
      message: "Status must be one of: pending, confirmed, in_production, ready, delivered, cancelled"
    },
    default: "pending",
    index: true // For status-based filtering
  },
  totalQuantity: {
    type: Number,
    default: 0,
    min: [0, "Total quantity cannot be negative"],
    index: true // For quantity-based queries
  }
}, {
  timestamps: true,
  // Optimize JSON serialization
  toJSON: {
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    transform: function(doc, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
    virtuals: true
  }
});

// **CRITICAL INDEXES FOR PERFORMANCE (MILLIONS OF RECORDS)**
// Single field indexes for primary lookups
OrderSchema.index({ orderNo: 1 }, { unique: true });
OrderSchema.index({ party: 1 });
OrderSchema.index({ poNo: 1 });
OrderSchema.index({ styleNo: 1 });
OrderSchema.index({ status: 1 });

// Compound indexes for common query patterns
OrderSchema.index({ party: 1, date: -1 }); // Orders by party and date
OrderSchema.index({ party: 1, status: 1 }); // Orders by party and status
OrderSchema.index({ date: -1, status: 1 }); // Recent orders by status
OrderSchema.index({ deliveryDate: 1, status: 1 }); // Delivery schedule
OrderSchema.index({ poDate: -1, party: 1 }); // PO date by party
OrderSchema.index({ styleNo: 1, party: 1 }); // Style by party

// Text index for search functionality
OrderSchema.index({ 
  orderNo: "text", 
  party: "text", 
  name: "text", 
  poNo: "text", 
  styleNo: "text" 
}, {
  weights: {
    orderNo: 5,
    party: 4,
    poNo: 3,
    styleNo: 2,
    name: 1
  }
});

// TTL index for data retention (optional - uncomment if needed)
// OrderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

// Pre-save middleware for data formatting and calculations
OrderSchema.pre('save', function(next) {
  // Auto-generate order number if not provided
  if (!this.orderNo) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNo = `ORD${timestamp}${random}`;
  }
  
  // Calculate total quantity
  this.totalQuantity = this.calculateTotalQuantity();
  
  // Validate delivery date is after order date
  if (this.deliveryDate && this.date && this.deliveryDate <= this.date) {
    return next(new Error('Delivery date must be after order date'));
  }
  
  // Validate PO date is before or equal to order date
  if (this.poDate && this.date && this.poDate > this.date) {
    return next(new Error('PO date cannot be after order date'));
  }
  
  next();
});

// Pre-update middleware
OrderSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  
  // Recalculate total quantity if items are updated
  if (update.items) {
    const totalQty = update.items.reduce((sum: number, item: IOrderItem) => sum + (item.quantity || 0), 0);
    update.totalQuantity = totalQty;
  }
  
  next();
});

// Instance methods
OrderSchema.methods.calculateTotalQuantity = function(): number {
  return this.items.reduce((sum: number, item: IOrderItem) => sum + item.quantity, 0);
};

OrderSchema.methods.updateStatus = async function(newStatus: string): Promise<void> {
  this.status = newStatus;
  await this.save();
};

// Static methods for common queries
OrderSchema.statics.findByOrderNo = function(orderNo: string) {
  return this.findOne({ orderNo: orderNo.toUpperCase() });
};

OrderSchema.statics.findByParty = function(party: string, limit = 50) {
  return this.find({ party: party.toUpperCase() })
    .sort({ date: -1 })
    .limit(limit);
};

OrderSchema.statics.findByDateRange = function(startDate: Date, endDate: Date) {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: -1 });
};

OrderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status }).sort({ date: -1 });
};

OrderSchema.statics.findPendingDeliveries = function() {
  return this.find({
    status: { $in: ["confirmed", "in_production", "ready"] },
    deliveryDate: { $lte: new Date() }
  }).sort({ deliveryDate: 1 });
};

OrderSchema.statics.getOrderStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalQuantity: { $sum: "$totalQuantity" }
      }
    }
  ]);
};

// Virtual for order summary
OrderSchema.virtual('orderSummary').get(function() {
  return {
    orderNo: this.orderNo,
    party: this.party,
    name: this.name,
    totalItems: this.items.length,
    totalQuantity: this.totalQuantity,
    status: this.status,
    deliveryDate: this.deliveryDate
  };
});

// Virtual for delivery status
OrderSchema.virtual('isOverdue').get(function() {
  if (this.status === "delivered" || this.status === "cancelled") return false;
  return this.deliveryDate < new Date();
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
const Order = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
