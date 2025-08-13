import mongoose, { Document, Schema } from "mongoose";

// TypeScript interface for better type safety
export interface IQuality extends Document {
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const QualitySchema = new Schema<IQuality>({
  name: {
    type: String,
    required: [true, "Quality name is required"],
    trim: true,
    minlength: [2, "Quality name must be at least 2 characters long"],
    maxlength: [100, "Quality name cannot exceed 100 characters"],
    unique: true,
    index: true // For name-based searches
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
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
QualitySchema.index({ name: 1 }); // Primary search field
QualitySchema.index({ createdAt: -1 }); // Recent qualities
QualitySchema.index({ updatedAt: -1 }); // Recently updated

// Compound indexes for common query patterns
QualitySchema.index({ name: 1, createdAt: -1 }); // Name searches with date sorting

// Text index for search functionality
QualitySchema.index({ 
  name: "text", 
  description: "text"
}, {
  weights: {
    name: 3,
    description: 1
  }
});

// Static methods for common queries
QualitySchema.statics.findByName = function(name: string) {
  return this.findOne({ name: { $regex: name, $options: 'i' } });
};

QualitySchema.statics.searchQualities = function(searchTerm: string) {
  return this.find({
    $text: { $search: searchTerm }
  }).sort({ score: { $meta: "textScore" } });
};

// Virtual for quality's full info
QualitySchema.virtual('fullInfo').get(function() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
});

// Error handling middleware
QualitySchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`${field} already exists`));
  } else {
    next(error);
  }
});

// Create and export the model
const Quality = mongoose.models.Quality || mongoose.model<IQuality>("Quality", QualitySchema);

export default Quality;
