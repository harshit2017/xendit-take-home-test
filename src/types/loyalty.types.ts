// src/types/loyalty.types.ts

export enum LoyaltyTransactionType {
  EARN = 'earn',
  REDEEM = 'redeem',
  EXPIRE = 'expire',
  ADJUSTMENT = 'adjustment',
}

export enum RewardDiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface ILoyaltySummary {
  currentBalance: number;
  lifetimePoints: number;
  tierId: string;
}

export interface ILoyaltyAccount {
  _id?: string;
  userId: string;
  currentBalance: number;
  lifetimePoints: number;
  tierId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoyaltyTier {
  _id?: string;
  name: string;
  slug: string;
  minLifetimePoints: number;
  benefits: string[];
  sortOrder: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRewardDiscountRules {
  type: RewardDiscountType;
  value: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
}

export interface IReward {
  _id?: string;
  name: string;
  description: string;
  pointsRequired: number;
  discountRules: IRewardDiscountRules;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPointBucket {
  _id?: string;
  userId: string;
  pointsRemaining: number;
  pointsOriginal: number;
  earnedAt: Date;
  expiresAt: Date;
  sourceTransactionId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoyaltyTransaction {
  _id?: string;
  userId: string;
  type: LoyaltyTransactionType;
  points: number;
  orderId?: string;
  rewardId?: string;
  balanceAfter: number;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRedeemRewardInput {
  rewardId: string;
  orderId?: string;
}
