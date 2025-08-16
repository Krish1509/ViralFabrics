import mongoose, { Document, Schema } from "mongoose";

export interface ICounter extends Document {
  _id: string;
  sequence: number;
}

// Static methods interface
export interface ICounterModel extends mongoose.Model<ICounter> {
  getNextSequence(name: string): Promise<number>;
}

const CounterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true
  },
  sequence: {
    type: Number,
    default: 0
  }
});

// Static method to get next sequence number
CounterSchema.statics.getNextSequence = async function(name: string): Promise<number> {
  const counter = await this.findByIdAndUpdate(
    name,
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  return counter.sequence;
};

const Counter = mongoose.models.Counter || mongoose.model<ICounter, ICounterModel>("Counter", CounterSchema);

export default Counter;
