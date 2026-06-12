// src/models/loyalty-transaction.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ILoyaltyTransaction, LoyaltyTransactionType } from '../types/loyalty.types';

const loyaltyTransactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(LoyaltyTransactionType),
      required: true,
    },
    points: { type: Number, required: true },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rewardId: {
      type: Schema.Types.ObjectId,
      ref: 'Reward',
    },
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ userId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ orderId: 1, type: 1 });

const LoyaltyTransaction = mongoose.model<ILoyaltyTransaction & Document>(
  'LoyaltyTransaction',
  loyaltyTransactionSchema
);

export default LoyaltyTransaction;
