// src/models/loyalty-account.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ILoyaltyAccount } from '../types/loyalty.types';

const loyaltyAccountSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentBalance: { type: Number, required: true, default: 0, min: 0 },
    lifetimePoints: { type: Number, required: true, default: 0, min: 0 },
    tierId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyTier',
      required: true,
    },
  },
  { timestamps: true }
);

const LoyaltyAccount = mongoose.model<ILoyaltyAccount & Document>(
  'LoyaltyAccount',
  loyaltyAccountSchema
);

export default LoyaltyAccount;
