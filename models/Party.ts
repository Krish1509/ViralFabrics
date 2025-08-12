import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for better type safety
export interface IParty extends Document {
  name: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartySchema = new Schema<IParty>({
  name: {
    type: String,
    required: [true, "Party name is required"],
    trim: true,
    minlength: [2, "Party name must be at least 2 characters long"],
    maxlength: [100, "Party name cannot exceed 100 characters"],
    index: true // For name-based searches
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
  address: {
    type: String,
    trim: true,
    maxlength: [200, "Address cannot exceed 200 characters"]
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
PartySchema.index({ name: 1 }); // Primary search field
PartySchema.index({ createdAt: -1 }); // Recent parties
PartySchema.index({ updatedAt: -1 }); // Recently updated

// Compound indexes for common query patterns
PartySchema.index({ name: 1, createdAt: -1 }); // Name searches with date sorting

// Text index for search functionality
PartySchema.index({ 
  name: "text", 
  contactName: "text", 
  address: "text" 
}, {
  weights: {
    name: 3,
    contactName: 2,
    address: 1
  }
});

// Static methods for common queries
PartySchema.statics.findByName = function(name: string) {
  return this.findOne({ name: { $regex: name, $options: 'i' } });
};

PartySchema.statics.searchParties = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: "textScore" } });
};

// Virtual for party's full info
PartySchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    contactName: this.contactName,
    contactPhone: this.contactPhone,
    address: this.address,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Error handling middleware
PartySchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`${field} already exists`));
  } else {
    next(error);
  }
});

// Create and export the model
const Party = mongoose.models.Party || mongoose.model<IParty>("Party", PartySchema);

export default Party;
