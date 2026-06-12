import LoyaltyAccount from '../../../src/models/loyalty-account.model';
import LoyaltyTier from '../../../src/models/loyalty-tier.model';
import LoyaltyTransaction from '../../../src/models/loyalty-transaction.model';
import PointBucket from '../../../src/models/point-bucket.model';
import Order from '../../../src/models/order.model';
import { LoyaltyService } from '../../../src/services/loyalty.service';
import { LoyaltyTransactionType } from '../../../src/types/loyalty.types';
import { OrderStatus } from '../../../src/types/order.types';

jest.mock('../../../src/models/loyalty-account.model');
jest.mock('../../../src/models/loyalty-tier.model');
jest.mock('../../../src/models/loyalty-transaction.model');
jest.mock('../../../src/models/point-bucket.model');
jest.mock('../../../src/models/reward.model');
jest.mock('../../../src/models/order.model');
jest.mock('../../../src/services/notification.service', () => ({
  notificationService: {
    sendNotification: jest.fn().mockResolvedValue({}),
  },
}));

describe('LoyaltyService', () => {
  let service: LoyaltyService;

  beforeEach(() => {
    service = new LoyaltyService();
    jest.clearAllMocks();
    (LoyaltyTier.findOneAndUpdate as jest.Mock).mockResolvedValue({});
    (LoyaltyTier.find as jest.Mock).mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: 'tier1', slug: 'bronze', minLifetimePoints: 0, sortOrder: 1 },
      ]),
    });
    (LoyaltyTier.findOne as jest.Mock).mockResolvedValue({ _id: 'tier1', slug: 'bronze' });
  });

  it('earns points idempotently for delivered orders', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({
      _id: 'order1',
      customerId: 'user1',
      total: 50,
      status: OrderStatus.DELIVERED,
    });
    (LoyaltyTransaction.findOne as jest.Mock).mockResolvedValue(null);
    (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue({
      userId: 'user1',
      currentBalance: 0,
      lifetimePoints: 0,
      tierId: 'tier1',
    });
    (LoyaltyAccount.findOneAndUpdate as jest.Mock).mockResolvedValue({
      userId: 'user1',
      currentBalance: 50,
      lifetimePoints: 50,
      tierId: 'tier1',
    });
    (LoyaltyTransaction.create as jest.Mock).mockResolvedValue({ _id: 'txn1' });
    (PointBucket.create as jest.Mock).mockResolvedValue({});

    const result = await service.earnPointsForOrder('order1');

    expect(result).toBeTruthy();
    expect(LoyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: LoyaltyTransactionType.EARN,
        points: 50,
      })
    );
  });

  it('expires points from expired buckets', async () => {
    (PointBucket.find as jest.Mock).mockResolvedValue([
      {
        _id: 'bucket1',
        userId: 'user1',
        pointsRemaining: 20,
        save: jest.fn().mockResolvedValue(true),
      },
    ]);
    (LoyaltyAccount.findOne as jest.Mock).mockResolvedValue({
      userId: 'user1',
      currentBalance: 20,
    });
    (LoyaltyAccount.findOneAndUpdate as jest.Mock).mockResolvedValue({
      userId: 'user1',
      currentBalance: 0,
    });
    (LoyaltyTransaction.create as jest.Mock).mockResolvedValue({});

    const expired = await service.expirePoints(new Date());

    expect(expired).toBe(1);
    expect(LoyaltyTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: LoyaltyTransactionType.EXPIRE,
        points: -20,
      })
    );
  });
});
