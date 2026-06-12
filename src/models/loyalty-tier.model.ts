// src/models/loyalty-tier.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ILoyaltyTier } from '../types/loyalty.types';

const loyaltyTierSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    minLifetimePoints: { type: Number, required: true, min: 0 },
    benefits: { type: [String], default: [] },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

loyaltyTierSchema.index({ minLifetimePoints: 1 });

const LoyaltyTier = mongoose.model<ILoyaltyTier & Document>('LoyaltyTier', loyaltyTierSchema);

export default LoyaltyTier;
