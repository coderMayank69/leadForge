import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IWebhookEvent extends Document {
  idempotencyKey: string;
  eventType: string;
  providerId: Types.ObjectId | null;
  payload: Record<string, unknown>;
  status: 'processing' | 'processed' | 'duplicate' | 'failed';
  processedAt: Date | null;
  createdAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    idempotencyKey: { type: String, required: true, unique: true },
    eventType: { type: String, required: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', default: null },
    payload: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ['processing', 'processed', 'duplicate', 'failed'],
      default: 'processing',
    },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Exactly-once guarantee via unique idempotency key
WebhookEventSchema.index({ idempotencyKey: 1 }, { unique: true });
WebhookEventSchema.index({ eventType: 1, createdAt: -1 });

const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);

export default WebhookEvent;
