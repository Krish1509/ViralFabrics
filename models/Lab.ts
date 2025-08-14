import mongoose, { Document, Schema, HydratedDocument } from "mongoose";

// Lab interface
export interface ILab extends Document {
  order: mongoose.Types.ObjectId;
  orderItemId: mongoose.Types.ObjectId;
  labSendDate: Date;
  labSendData?: string | Record<string, any>;
  labSendNumber: string;
  status: 'sent' | 'received' | 'cancelled';
  receivedDate?: Date;
  attachments?: Array<{
    url: string;
    fileName: string;
  }>;
  remarks?: string;
  softDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Static methods interface
export interface ILabModel extends mongoose.Model<ILab> {
  findByOrder(orderId: string): Promise<ILab[]>;
  findByOrderItem(orderId: string, orderItemId: string): Promise<ILab | null>;
  searchLabs(query: string): Promise<ILab[]>;
  findByStatus(status: 'sent' | 'received' | 'cancelled'): Promise<ILab[]>;
}

const LabSchema = new Schema<ILab>({
  order: {
    type: Schema.Types.ObjectId,
    ref: "Order",
    required: [true, "Order is required"]
  },
  orderItemId: {
    type: Schema.Types.ObjectId,
    required: [true, "Order item ID is required"]
  },
  labSendDate: {
    type: Date,
    required: [true, "Lab send date is required"]
  },
  labSendData: {
    type: Schema.Types.Mixed, // Can be string or object
    default: null
  },
  labSendNumber: {
    type: String,
    required: [true, "Lab send number is required"],
    trim: true,
    maxlength: [100, "Lab send number cannot exceed 100 characters"]
  },
  status: {
    type: String,
    enum: {
      values: ["sent", "received", "cancelled"],
      message: "Status must be either 'sent', 'received', or 'cancelled'"
    },
    default: "sent"
  },
  receivedDate: {
    type: Date,
    default: null
  },
  attachments: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "File name cannot exceed 200 characters"]
    }
  }],
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, "Remarks cannot exceed 500 characters"]
  },
  softDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
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
// Unique compound index to ensure one lab per order item
LabSchema.index({ order: 1, orderItemId: 1 }, { unique: true });

// Single field indexes
LabSchema.index({ labSendNumber: 1 });
LabSchema.index({ order: 1 });
LabSchema.index({ status: 1 });
LabSchema.index({ labSendDate: -1 });
LabSchema.index({ createdAt: -1 });
LabSchema.index({ softDeleted: 1 });

// Compound indexes for common query patterns
LabSchema.index({ order: 1, status: 1 });
LabSchema.index({ order: 1, softDeleted: 1 });
LabSchema.index({ status: 1, softDeleted: 1 });
LabSchema.index({ labSendDate: -1, status: 1 });

// Text index for search functionality
LabSchema.index({ 
  labSendNumber: "text",
  remarks: "text"
}, {
  weights: {
    labSendNumber: 2,
    remarks: 1
  }
});

// Pre-save middleware to validate order item exists
LabSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('order') || this.isModified('orderItemId')) {
    try {
      const Order = mongoose.model('Order');
      const order = await Order.findById(this.order);
      
      if (!order) {
        return next(new Error('Order not found'));
      }
      
      const itemExists = order.items.some((item: any) => 
        item._id.toString() === this.orderItemId.toString()
      );
      
      if (!itemExists) {
        return next(new Error('Order item not found'));
      }
      
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Static methods
LabSchema.statics.findByOrder = function(orderId: string) {
  return this.find({ 
    order: orderId, 
    softDeleted: false 
  }).populate('order').sort({ createdAt: -1 });
};

LabSchema.statics.findByOrderItem = function(orderId: string, orderItemId: string) {
  return this.findOne({ 
    order: orderId, 
    orderItemId: orderItemId,
    softDeleted: false 
  }).populate('order');
};

LabSchema.statics.searchLabs = function(query: string) {
  return this.find({
    $text: { $search: query },
    softDeleted: false
  }).populate('order').sort({ score: { $meta: "textScore" } });
};

LabSchema.statics.findByStatus = function(status: 'sent' | 'received' | 'cancelled') {
  return this.find({ 
    status, 
    softDeleted: false 
  }).populate('order').sort({ createdAt: -1 });
};

// Virtual for lab's full info
LabSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    order: this.order,
    orderItemId: this.orderItemId,
    labSendDate: this.labSendDate,
    labSendData: this.labSendData,
    labSendNumber: this.labSendNumber,
    status: this.status,
    receivedDate: this.receivedDate,
    attachments: this.attachments,
    remarks: this.remarks,
    softDeleted: this.softDeleted,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Error handling middleware
LabSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    if (field === 'order_1_orderItemId_1') {
      next(new Error('A lab already exists for this order item'));
    } else {
      next(new Error(`${field} already exists`));
    }
  } else {
    next(error);
  }
});

// Create and export the model
const Lab = mongoose.models.Lab || mongoose.model<ILab, ILabModel>("Lab", LabSchema);

export default Lab;
export type LabDoc = HydratedDocument<ILab>;
