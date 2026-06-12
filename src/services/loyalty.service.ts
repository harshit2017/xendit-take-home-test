// src/services/loyalty.service.ts
import LoyaltyAccount from '../models/loyalty-account.model';
import LoyaltyTier from '../models/loyalty-tier.model';
import LoyaltyTransaction from '../models/loyalty-transaction.model';
import PointBucket from '../models/point-bucket.model';
import Reward from '../models/reward.model';
import Order from '../models/order.model';
import {
  ILoyaltyAccount,
  ILoyaltySummary,
  ILoyaltyTier,
  ILoyaltyTransaction,
  IReward,
  LoyaltyTransactionType,
  RewardDiscountType,
  IRedeemRewardInput,
} from '../types/loyalty.types';
import { OrderStatus } from '../types/order.types';
import {
  calculateDiscountAmount,
  calculatePointsFromOrderTotal,
  DEFAULT_LOYALTY_POINT_EXPIRY_DAYS,
  resolveTierForLifetimePoints,
} from '../utils/loyalty.utils';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors';
import { notificationService } from './notification.service';
import { NotificationCategory, NotificationType } from '../types/notification.types';

const DEFAULT_TIERS = [
  { name: 'Bronze', slug: 'bronze', minLifetimePoints: 0, benefits: ['Earn 1 point per $1'], sortOrder: 1 },
  { name: 'Silver', slug: 'silver', minLifetimePoints: 500, benefits: ['5% bonus points'], sortOrder: 2 },
  { name: 'Gold', slug: 'gold', minLifetimePoints: 2000, benefits: ['10% bonus points', 'Priority support'], sortOrder: 3 },
  { name: 'Platinum', slug: 'platinum', minLifetimePoints: 5000, benefits: ['15% bonus points', 'Free delivery monthly'], sortOrder: 4 },
];

export class LoyaltyService {
  public async ensureDefaultTiers(): Promise<void> {
    for (const tier of DEFAULT_TIERS) {
      await LoyaltyTier.findOneAndUpdate({ slug: tier.slug }, tier, { upsert: true, new: true });
    }
  }

  public async getTiers(): Promise<ILoyaltyTier[]> {
    await this.ensureDefaultTiers();
    return LoyaltyTier.find().sort({ sortOrder: 1 });
  }

  public async getAvailableRewards(): Promise<IReward[]> {
    await this.ensureDefaultRewards();
    return Reward.find({ isActive: true }).sort({ pointsRequired: 1 });
  }

  public async ensureDefaultRewards(): Promise<void> {
    const defaults = [
      {
        name: '$5 Off',
        description: 'Get $5 off your next order',
        pointsRequired: 100,
        discountRules: { type: RewardDiscountType.FIXED, value: 5, minOrderValue: 20 },
      },
      {
        name: '10% Off',
        description: 'Get 10% off your next order',
        pointsRequired: 250,
        discountRules: {
          type: RewardDiscountType.PERCENTAGE,
          value: 10,
          minOrderValue: 30,
          maxDiscountAmount: 15,
        },
      },
    ];

    for (const reward of defaults) {
      await Reward.findOneAndUpdate({ name: reward.name }, reward, { upsert: true, new: true });
    }
  }

  public async getOrCreateAccount(userId: string): Promise<ILoyaltyAccount> {
    await this.ensureDefaultTiers();

    let account = await LoyaltyAccount.findOne({ userId });
    if (account) {
      return account;
    }

    const bronzeTier = await LoyaltyTier.findOne({ slug: 'bronze' });
    if (!bronzeTier) {
      throw new NotFoundError('Default loyalty tier not found');
    }

    account = await LoyaltyAccount.create({
      userId,
      currentBalance: 0,
      lifetimePoints: 0,
      tierId: bronzeTier._id,
    });

    return account;
  }

  public async getLoyaltySummary(userId: string): Promise<ILoyaltySummary & { tier: ILoyaltyTier }> {
    const account = await this.getOrCreateAccount(userId);
    const tier = await LoyaltyTier.findById(account.tierId);

    if (!tier) {
      throw new NotFoundError('Loyalty tier not found');
    }

    return {
      currentBalance: account.currentBalance,
      lifetimePoints: account.lifetimePoints,
      tierId: account.tierId.toString(),
      tier,
    };
  }

  public async getTransactions(userId: string, limit = 50): Promise<ILoyaltyTransaction[]> {
    return LoyaltyTransaction.find({ userId }).sort({ createdAt: -1 }).limit(limit);
  }

  public async earnPointsForOrder(orderId: string): Promise<ILoyaltyTransaction | null> {
    const order = await Order.findById(orderId);
    if (!order || order.status !== OrderStatus.DELIVERED) {
      return null;
    }

    const existing = await LoyaltyTransaction.findOne({
      orderId,
      type: LoyaltyTransactionType.EARN,
    });
    if (existing) {
      return existing;
    }

    const points = calculatePointsFromOrderTotal(order.total);
    if (points <= 0) {
      return null;
    }

    const userId = order.customerId.toString();
    const account = await this.getOrCreateAccount(userId);
    const expiresAt = new Date(
      Date.now() + DEFAULT_LOYALTY_POINT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    );

    const tiers = await this.getTiers();
    const newLifetimePoints = account.lifetimePoints + points;
    const matchedTier = resolveTierForLifetimePoints(tiers, newLifetimePoints);

    const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
      { userId },
      {
        $inc: { currentBalance: points, lifetimePoints: points },
        $set: { tierId: matchedTier?._id ?? account.tierId },
      },
      { new: true }
    );

    const balanceAfter = updatedAccount?.currentBalance ?? account.currentBalance + points;

    const transaction = await LoyaltyTransaction.create({
      userId,
      type: LoyaltyTransactionType.EARN,
      points,
      orderId,
      balanceAfter,
      description: `Earned ${points} points for order ${orderId}`,
    });

    await PointBucket.create({
      userId,
      pointsRemaining: points,
      pointsOriginal: points,
      earnedAt: new Date(),
      expiresAt,
      sourceTransactionId: transaction._id,
    });

    await notificationService.sendNotification({
      userId,
      category: NotificationCategory.LOYALTY,
      type: NotificationType.LOYALTY_POINTS_EARNED,
      title: 'Points earned',
      message: `You earned ${points} loyalty points.`,
      idempotencyKey: `loyalty:earn:${orderId}`,
      data: { orderId, points, balanceAfter },
    });

    return transaction;
  }

  public async redeemReward(
    userId: string,
    input: IRedeemRewardInput
  ): Promise<{ transaction: ILoyaltyTransaction; discountAmount: number }> {
    const reward = await Reward.findById(input.rewardId);
    if (!reward || !reward.isActive) {
      throw new NotFoundError('Reward not found');
    }

    const account = await this.getOrCreateAccount(userId);
    const spendableBalance = await this.getSpendableBalance(userId);

    if (spendableBalance < reward.pointsRequired) {
      throw new BadRequestError('Insufficient loyalty points');
    }

    let orderSubtotal = 0;
    if (input.orderId) {
      const order = await Order.findById(input.orderId);
      if (!order) {
        throw new NotFoundError('Order not found');
      }
      if (order.customerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to redeem points for this order');
      }
      orderSubtotal = order.subtotal;
    }

    const discountAmount = calculateDiscountAmount(
      orderSubtotal || 100,
      reward.discountRules.type,
      reward.discountRules.value,
      reward.discountRules.minOrderValue,
      reward.discountRules.maxDiscountAmount
    );

    await this.consumePointsFifo(userId, reward.pointsRequired);

    const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
      { userId },
      { $inc: { currentBalance: -reward.pointsRequired } },
      { new: true }
    );

    const balanceAfter = Math.max(updatedAccount?.currentBalance ?? 0, 0);

    const transaction = await LoyaltyTransaction.create({
      userId,
      type: LoyaltyTransactionType.REDEEM,
      points: -reward.pointsRequired,
      orderId: input.orderId,
      rewardId: reward._id,
      balanceAfter,
      description: `Redeemed reward: ${reward.name}`,
      metadata: { discountAmount },
    });

    return { transaction, discountAmount };
  }

  public async expirePoints(now: Date = new Date()): Promise<number> {
    const expiredBuckets = await PointBucket.find({
      expiresAt: { $lte: now },
      pointsRemaining: { $gt: 0 },
    });

    let expiredCount = 0;

    for (const bucket of expiredBuckets) {
      const pointsToExpire = bucket.pointsRemaining;
      const userId = bucket.userId.toString();

      bucket.pointsRemaining = 0;
      await bucket.save();

      const account = await LoyaltyAccount.findOne({ userId });
      if (!account) {
        continue;
      }

      const updatedAccount = await LoyaltyAccount.findOneAndUpdate(
        { userId },
        { $inc: { currentBalance: -pointsToExpire } },
        { new: true }
      );
      const balanceAfter = Math.max(updatedAccount?.currentBalance ?? 0, 0);

      await LoyaltyTransaction.create({
        userId,
        type: LoyaltyTransactionType.EXPIRE,
        points: -pointsToExpire,
        balanceAfter,
        description: `Expired ${pointsToExpire} points`,
        metadata: { bucketId: bucket._id, expiredAt: now.toISOString() },
      });

      expiredCount++;
    }

    return expiredCount;
  }

  private async getSpendableBalance(userId: string): Promise<number> {
    const now = new Date();
    const buckets = await PointBucket.find({
      userId,
      pointsRemaining: { $gt: 0 },
      expiresAt: { $gt: now },
    });

    return buckets.reduce((sum, bucket) => sum + bucket.pointsRemaining, 0);
  }

  private async consumePointsFifo(userId: string, pointsNeeded: number): Promise<void> {
    const now = new Date();
    const buckets = await PointBucket.find({
      userId,
      pointsRemaining: { $gt: 0 },
      expiresAt: { $gt: now },
    }).sort({ earnedAt: 1 });

    let remaining = pointsNeeded;

    for (const bucket of buckets) {
      if (remaining <= 0) {
        break;
      }

      const consumed = Math.min(bucket.pointsRemaining, remaining);
      bucket.pointsRemaining -= consumed;
      remaining -= consumed;
      await bucket.save();
    }

    if (remaining > 0) {
      throw new BadRequestError('Insufficient spendable loyalty points');
    }
  }

}

export const loyaltyService = new LoyaltyService();
