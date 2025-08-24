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
  createdAt: Date;
  updatedAt: Date;
}

const FabricSchema = new Schema<IFabric>({
  qualityCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 50
  },
  qualityName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  weaver: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  weaverQualityName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  greighWidth: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  finishWidth: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  weight: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  gsm: {
    type: Number,
    required: false,
    min: 0,
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
    min: 0,
    default: 0
  },
  pick: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  greighRate: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  label: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Create indexes for better performance
FabricSchema.index({ qualityCode: 1 });
FabricSchema.index({ qualityName: 1 });
FabricSchema.index({ weaver: 1 });
FabricSchema.index({ weaverQualityName: 1 });

// Auto-generate label before saving
FabricSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.label = `QUALITY CODE : ${this.qualityCode}\n${this.qualityName} ${this.weaverQualityName}\nWEIGHT: ${this.weight} KG , GSM : ${this.gsm}\nWIDTH: ${this.finishWidth}"`;
  }
  next();
});

export default mongoose.models.Fabric || mongoose.model<IFabric>('Fabric', FabricSchema);
