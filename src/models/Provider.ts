import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProvider extends Document {
  name: string;
  slug: string;
  monthlyQuota: number;
  currentMonthLeads: number;
  quotaResetAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProviderSchema = new Schema<IProvider>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    monthlyQuota: { type: Number, required: true, default: 10 },
    currentMonthLeads: { type: Number, required: true, default: 0 },
    quotaResetAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProviderSchema.index({ slug: 1 }, { unique: true });
ProviderSchema.index({ isActive: 1, currentMonthLeads: 1 });

// Virtual: remaining quota
ProviderSchema.virtual('remainingQuota').get(function () {
  return Math.max(0, this.monthlyQuota - this.currentMonthLeads);
});

// Ensure virtuals are included in JSON
ProviderSchema.set('toJSON', { virtuals: true });
ProviderSchema.set('toObject', { virtuals: true });

const Provider: Model<IProvider> =
  mongoose.models.Provider || mongoose.model<IProvider>('Provider', ProviderSchema);

export default Provider;
