import mongoose, { Schema, Document } from 'mongoose';

export interface IFabric extends Document {
  qualityCode: string;
  qualityName: string;
  weaver: string;
  weaverQualityName: string;
  greighWidth: number;
  finishWidth: number;
  weight: number;
  gsm: number;
  danier: string;
  reed: number;
  pick: number;
  greighRate: number;
  label: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FabricSchema = new Schema<IFabric>({
  qualityCode: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50,
    default: ''
  },
  qualityName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
    default: ''
  },
  weaver: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
    default: ''
  },
  weaverQualityName: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100,
    default: ''
  },
  greighWidth: {
    type: Number,
    required: false,
    default: 0
  },
  finishWidth: {
    type: Number,
    required: false,
    default: 0
  },
  weight: {
    type: Number,
    required: false,
    default: 0
  },
  gsm: {
    type: Number,
    required: false,
    default: 0
  },
  danier: {
    type: String,
    required: false,
    trim: true,
    maxlength: 50,
    default: ''
  },
  reed: {
    type: Number,
    required: false,
    default: 0
  },
  pick: {
    type: Number,
    required: false,
    default: 0
  },
  greighRate: {
    type: Number,
    required: false,
    default: 0
  },
  label: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
    default: ''
  },
  images: {
    type: [String],
    required: false,
    default: []
  }
}, {
  timestamps: true
});

// No indexes to avoid conflicts - all fields are optional
// FabricSchema.index({ qualityName: 1 });
// FabricSchema.index({ weaver: 1 });
// FabricSchema.index({ weaverQualityName: 1 });
// FabricSchema.index({ qualityCode: 1 }, { unique: true, sparse: true });

// Auto-generate label before saving
FabricSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.label = `QUALITY CODE : ${this.qualityCode}\n${this.qualityName} ${this.weaverQualityName}\nWEIGHT: ${this.weight} KG , GSM : ${this.gsm}\nWIDTH: ${this.finishWidth}"`;
  }
  next();
});

// Force model reset to ensure schema changes take effect
const modelName = 'Fabric';
if (mongoose.models[modelName]) {
  delete mongoose.models[modelName];
}

  // Also clear the model from the connection
  if (mongoose.connection.models[modelName]) {
    delete (mongoose.connection.models as any)[modelName];
  }

export default mongoose.model<IFabric>(modelName, FabricSchema);
