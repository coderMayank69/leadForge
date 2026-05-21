import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface ILeadAssignment extends Document {
  leadId: Types.ObjectId;
  providerId: Types.ObjectId;
  serviceId: Types.ObjectId;
  assignmentType: 'mandatory' | 'fair_rotation';
  assignmentReason: string;
  assignedAt: Date;
  createdAt: Date;
}

const LeadAssignmentSchema = new Schema<ILeadAssignment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    assignmentType: {
      type: String,
      enum: ['mandatory', 'fair_rotation'],
      required: true,
    },
    assignmentReason: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// UNIQUE: same provider cannot receive same lead twice
LeadAssignmentSchema.index({ leadId: 1, providerId: 1 }, { unique: true });
// Quick lookups for provider dashboard
LeadAssignmentSchema.index({ providerId: 1, assignedAt: -1 });
LeadAssignmentSchema.index({ leadId: 1 });

const LeadAssignment: Model<ILeadAssignment> =
  mongoose.models.LeadAssignment ||
  mongoose.model<ILeadAssignment>('LeadAssignment', LeadAssignmentSchema);

export default LeadAssignment;
