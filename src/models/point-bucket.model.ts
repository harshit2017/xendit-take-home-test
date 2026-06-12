// src/models/point-bucket.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IPointBucket } from '../types/loyalty.types';

const pointBucketSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pointsRemaining: { type: Number, required: true, min: 0 },
    pointsOriginal: { type: Number, required: true, min: 0 },
    earnedAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true, index: true },
    sourceTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'LoyaltyTransaction',
    },
  },
  { timestamps: true }
);

pointBucketSchema.index({ userId: 1, earnedAt: 1 });
pointBucketSchema.index({ userId: 1, expiresAt: 1, pointsRemaining: 1 });

const PointBucket = mongoose.model<IPointBucket & Document>('PointBucket', pointBucketSchema);

export default PointBucket;
