import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IAuditLog extends Document {
  action: string;
  entityType: string;
  entityId: Types.ObjectId | null;
  details: Record<string, unknown>;
  timestamp: Date;
  requestId: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
    requestId: { type: String, default: '' },
  },
  { timestamps: true }
);

AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
