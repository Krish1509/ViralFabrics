import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";

// TypeScript interface for better type safety
export interface IUser extends Document {
  name: string;
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  role: "superadmin" | "user";
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Validation functions
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone: string) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone);
};

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    index: true // For name-based searches
  },
  username: {
    type: String,
    unique: true,
    required: [true, "Username is required"],
    trim: true,
    lowercase: true,
    minlength: [3, "Username must be at least 3 characters long"],
    maxlength: [30, "Username cannot exceed 30 characters"],
    match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    index: true // Primary lookup field
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [8, "Password must be at least 8 characters long"],
    select: false // Don't include password in queries by default
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Allow multiple null values
    validate: {
      validator: validateEmail,
      message: "Please provide a valid email address"
    },
    index: true // For email-based lookups
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true,
    validate: {
      validator: validatePhoneNumber,
      message: "Please provide a valid phone number"
    }
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, "Address cannot exceed 200 characters"]
  },
  role: {
    type: String,
    enum: {
      values: ["superadmin", "user"],
      message: "Role must be either 'superadmin' or 'user'"
    },
    default: "user",
    index: true // For role-based filtering
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true // For active user filtering
  },
  lastLogin: {
    type: Date,
    index: true // For login analytics
  }
}, {
  timestamps: true,
  // Optimize JSON serialization
  toJSON: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    },
    virtuals: true
  },
  toObject: {
    transform: function(doc, ret: any) {
      delete ret.password;
      return ret;
    },
    virtuals: true
  }
});

// **CRITICAL INDEXES FOR PERFORMANCE**
// Compound indexes for common query patterns
UserSchema.index({ username: 1, isActive: 1 }); // Login queries
UserSchema.index({ role: 1, isActive: 1 }); // Role-based filtering
UserSchema.index({ createdAt: -1, isActive: 1 }); // Recent users
UserSchema.index({ lastLogin: -1, isActive: 1 }); // Active users
UserSchema.index({ name: 1, isActive: 1 }); // Name searches
UserSchema.index({ email: 1, isActive: 1 }); // Email lookups

// Text index for search functionality
UserSchema.index({ 
  name: "text", 
  username: "text", 
  email: "text" 
}, {
  weights: {
    name: 3,
    username: 2,
    email: 1
  }
});

// Pre-save middleware for password hashing
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-update middleware for password hashing
UserSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate() as any;
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Static methods for common queries
UserSchema.statics.findByUsernameOrEmail = function(identifier: string) {
  return this.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() }
    ]
  }).select('+password');
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true }).select('-password');
};

UserSchema.statics.findByRole = function(role: string) {
  return this.find({ role, isActive: true }).select('-password');
};

// Virtual for user's full profile info
UserSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    phoneNumber: this.phoneNumber,
    address: this.address,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
});

// Error handling middleware
UserSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    next(new Error(`${field} already exists`));
  } else {
    next(error);
  }
});

// Create and export the model
const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
