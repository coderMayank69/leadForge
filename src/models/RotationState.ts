import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRotationState extends Document {
  serviceSlug: string;
  poolIndex: number;
  updatedAt: Date;
}

const RotationStateSchema = new Schema<IRotationState>(
  {
    serviceSlug: { type: String, required: true, unique: true },
    poolIndex: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

RotationStateSchema.index({ serviceSlug: 1 }, { unique: true });

const RotationState: Model<IRotationState> =
  mongoose.models.RotationState ||
  mongoose.model<IRotationState>('RotationState', RotationStateSchema);

export default RotationState;
