import mongoose, { Document, Schema, Model } from "mongoose";

// Enhanced TypeScript interfaces
export interface ICounter extends Document {
  _id: string;
  sequence: number;
  prefix?: string;
  suffix?: string;
  format?: string;
  lastReset?: Date;
  metadata: {
    createdBy?: string;
    description?: string;
    category?: string;
    isActive: boolean;
    notes?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  increment(amount?: number): this;
  reset(): this;
  getFormattedNumber(): string;
  currentNumber: string;
}

// Enhanced static methods interface
export interface ICounterModel extends Model<ICounter> {
  getNextSequence(name: string, prefix?: string, suffix?: string): Promise<number>;
  getNextFormattedSequence(name: string, format?: string): Promise<string>;
  resetSequence(name: string): Promise<void>;
  findActiveCounters(): Promise<ICounter[]>;
  findByCategory(category: string): Promise<ICounter[]>;
  getCounterStats(): Promise<any>;
  cleanupInactiveCounters(): Promise<void>;
}

// Validation functions
const validateCounterName = (name: string) => {
  return /^[a-zA-Z0-9_]{2,30}$/.test(name);
};

const validateFormat = (format: string) => {
  return /^[A-Z0-9#\-_]{3,20}$/.test(format);
};

const CounterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true,
    validate: {
      validator: validateCounterName,
      message: "Counter name can only contain letters, numbers, and underscores (2-30 characters)"
    }
  },
  sequence: {
    type: Number,
    default: 0,
    min: [0, "Sequence cannot be negative"],
    index: true
  },
  prefix: {
    type: String,
    trim: true,
    maxlength: [10, "Prefix cannot exceed 10 characters"],
    uppercase: true
  },
  suffix: {
    type: String,
    trim: true,
    maxlength: [10, "Suffix cannot exceed 10 characters"],
    uppercase: true
  },
  format: {
    type: String,
    trim: true,
    uppercase: true,
    validate: {
      validator: validateFormat,
      message: "Format can only contain uppercase letters, numbers, #, hyphens, and underscores (3-20 characters)"
    }
  },
  lastReset: {
    type: Date,
    index: true
  },
  metadata: {
    createdBy: {
      type: String,
      maxlength: [50, "Creator name cannot exceed 50 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"]
    },
    category: {
      type: String,
      enum: {
        values: ['order', 'user', 'party', 'quality', 'lab', 'invoice', 'other'],
        message: "Category must be one of: order, user, party, quality, lab, invoice, other"
      },
      default: 'other',
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"]
    }
  }
}, {
  timestamps: true,
  collection: 'counters',
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

// **EXACT INDEXES TO ADD**
// Primary indexes
CounterSchema.index({ sequence: -1 }, { name: 'idx_counter_sequence_desc' });
CounterSchema.index({ lastReset: -1 }, { name: 'idx_counter_last_reset' });
CounterSchema.index({ createdAt: -1 }, { name: 'idx_counter_created_desc' });
CounterSchema.index({ updatedAt: -1 }, { name: 'idx_counter_updated_desc' });

// Compound indexes for common query patterns
CounterSchema.index({ "metadata.category": 1, "metadata.isActive": 1 }, { name: 'idx_counter_category_active' });
CounterSchema.index({ "metadata.isActive": 1, sequence: -1 }, { name: 'idx_counter_active_sequence' });
CounterSchema.index({ "metadata.category": 1, lastReset: -1 }, { name: 'idx_counter_category_reset' });

// Text search index
CounterSchema.index({ 
  _id: "text",
  "metadata.description": "text",
  "metadata.notes": "text"
}, {
  weights: {
    _id: 10,
    "metadata.description": 5,
    "metadata.notes": 2
  },
  name: "idx_counter_text_search"
});

// **VALIDATION RULES**
// ✅ Required: _id, sequence
// ✅ Regex: _id format, format validation
// ✅ Enums: category (order, user, party, quality, lab, invoice, other)
// ✅ Min/Max: _id (2-30), sequence (0+), prefix/suffix (0-10), format (3-20), description (0-200), notes (0-500)
// ✅ Custom validation: _id format, format validation

// **EMBED VS REFERENCE DECISIONS**
// ✅ **Embedded**: metadata (small, always with counter)
// ✅ **Embedded**: prefix/suffix (small, always with counter)

// **TTL/TIME-SERIES OPTIMIZATIONS**
// Consider TTL for:
// - Inactive counters (1 year)
// - Old reset logs (6 months)

// **INSTANCE METHODS**
CounterSchema.methods.increment = function(amount: number = 1): any {
  this.sequence += amount;
  return this;
};

CounterSchema.methods.reset = function(): any {
  this.sequence = 0;
  this.lastReset = new Date();
  return this;
};

CounterSchema.methods.getFormattedNumber = function(): string {
  let formatted = this.sequence.toString();
  
  // Apply format if specified
  if (this.format) {
    const padded = formatted.padStart(this.format.length, '0');
    formatted = this.format.replace(/#/g, (match: string, index: number) => {
      return padded[index] || '0';
    });
  }
  
  // Add prefix and suffix
  if (this.prefix) {
    formatted = this.prefix + formatted;
  }
  if (this.suffix) {
    formatted = formatted + this.suffix;
  }
  
  return formatted;
};

// **STATIC METHODS**
CounterSchema.statics.getNextSequence = async function(name: string, prefix?: string, suffix?: string): Promise<number> {
  try {
    const counter = await this.findByIdAndUpdate(
      name,
      { 
        $inc: { sequence: 1 },
        $setOnInsert: { 
          prefix, 
          suffix,
          metadata: { isActive: true }
        }
      },
      { new: true, upsert: true, maxTimeMS: 5000 }
    );
    return counter.sequence;
  } catch (error) {
    console.error(`Error getting next sequence for ${name}:`, error);
    throw new Error(`Failed to generate sequence for ${name}`);
  }
};

CounterSchema.statics.getNextFormattedSequence = async function(name: string, format?: string): Promise<string> {
  const counter = await this.findByIdAndUpdate(
    name,
    { 
      $inc: { sequence: 1 },
      $setOnInsert: { 
        format,
        metadata: { isActive: true }
      }
    },
    { new: true, upsert: true }
  );
  return counter.getFormattedNumber();
};

CounterSchema.statics.resetSequence = async function(name: string): Promise<void> {
  await this.findByIdAndUpdate(name, {
    $set: {
      sequence: 0,
      lastReset: new Date()
    }
  });
};

CounterSchema.statics.findActiveCounters = function(): Promise<ICounter[]> {
  return this.find({ "metadata.isActive": true })
    .sort({ "metadata.category": 1, _id: 1 })
    .lean();
};

CounterSchema.statics.findByCategory = function(category: string): Promise<ICounter[]> {
  return this.find({ 
    "metadata.category": category,
    "metadata.isActive": true 
  })
    .sort({ sequence: -1 })
    .lean();
};

CounterSchema.statics.getCounterStats = async function(): Promise<any> {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCounters: { $sum: 1 },
        activeCounters: { $sum: { $cond: [{ $eq: ["$metadata.isActive", true] }, 1, 0] } },
        totalSequence: { $sum: "$sequence" },
        avgSequence: { $avg: "$sequence" },
        maxSequence: { $max: "$sequence" }
      }
    }
  ]);
  
  const categoryStats = await this.aggregate([
    {
      $group: {
        _id: "$metadata.category",
        count: { $sum: 1 },
        totalSequence: { $sum: "$sequence" }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
  
  return {
    ...stats[0],
    categoryStats
  };
};

CounterSchema.statics.cleanupInactiveCounters = async function(): Promise<void> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  await this.updateMany(
    { 
      "metadata.isActive": false,
      updatedAt: { $lt: oneYearAgo }
    },
    {
      $set: {
        "metadata.isActive": false
      }
    }
  );
};

// **VIRTUAL FIELDS**
CounterSchema.virtual('currentNumber').get(function() {
  return this.getFormattedNumber();
});

CounterSchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    sequence: this.sequence,
    prefix: this.prefix,
    suffix: this.suffix,
    format: this.format,
    lastReset: this.lastReset,
    currentNumber: this.currentNumber,
    metadata: this.metadata,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// **MIDDLEWARE**
CounterSchema.pre('save', function(next) {
  // Ensure sequence is never negative
  if (this.sequence < 0) {
    this.sequence = 0;
  }
  
  // Normalize prefix and suffix
  if (this.prefix) {
    this.prefix = this.prefix.toUpperCase().trim();
  }
  if (this.suffix) {
    this.suffix = this.suffix.toUpperCase().trim();
  }
  if (this.format) {
    this.format = this.format.toUpperCase().trim();
  }
  
  next();
});

CounterSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    next(new Error('Counter with this name already exists'));
  } else {
    next(error);
  }
});

// **QUERY OPTIMIZATION**
CounterSchema.pre('find', function() {
  this.lean();
});

CounterSchema.pre('findOne', function() {
  this.lean();
});

const Counter = mongoose.models.Counter || mongoose.model<ICounter, ICounterModel>("Counter", CounterSchema);

export default Counter;
