import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILead extends Document {
  customerName: string;
  phoneNumber: string;
  city: string;
  serviceId: Types.ObjectId;
  serviceName: string;
  description: string;
  status: 'pending' | 'assigned' | 'failed';
  assignedProviderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    customerName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'assigned', 'failed'],
      default: 'pending',
    },
    assignedProviderCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// DATABASE-LEVEL duplicate prevention
// Same phone + same service = rejected
LeadSchema.index({ phoneNumber: 1, serviceId: 1 }, { unique: true });
LeadSchema.index({ status: 1 });
LeadSchema.index({ createdAt: -1 });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
