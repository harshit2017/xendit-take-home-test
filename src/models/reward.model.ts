// src/models/reward.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IReward, RewardDiscountType } from '../types/loyalty.types';

const rewardSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    pointsRequired: { type: Number, required: true, min: 1 },
    discountRules: {
      type: {
        type: String,
        enum: Object.values(RewardDiscountType),
        required: true,
      },
      value: { type: Number, required: true, min: 0 },
      minOrderValue: { type: Number, min: 0 },
      maxDiscountAmount: { type: Number, min: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

rewardSchema.index({ isActive: 1, pointsRequired: 1 });

const Reward = mongoose.model<IReward & Document>('Reward', rewardSchema);

export default Reward;
