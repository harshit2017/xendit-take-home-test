import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '@models/user.model';
import Restaurant from '@models/restaurant.model';
import MenuItem from '@models/menu.model';
import Translation from '@models/translation.model';
import Order from '@models/order.model';
import LoyaltyAccount from '@models/loyalty-account.model';
import LoyaltyTransaction from '@models/loyalty-transaction.model';
import PointBucket from '@models/point-bucket.model';
import Reward from '@models/reward.model';
import LoyaltyTier from '@models/loyalty-tier.model';
import { connectDB, disconnectDB } from '@config/database';
import { loyaltyService } from '@services/loyalty.service';
import { OrderStatus, PaymentStatus } from '@app-types/order.types';
import { LoyaltyTransactionType } from '@app-types/loyalty.types';
import { DEFAULT_LOYALTY_POINT_EXPIRY_DAYS } from '@utils/loyalty.utils';
import { SEED_PASSWORD, seedUsers } from './data/users.seed';
import { seedRestaurants } from './data/restaurants.seed';
import { seedMenuItems } from './data/menu-items.seed';
import { seedTranslations } from './data/translations.seed';

dotenv.config();

type IdMap = Record<string, string>;

const clearDatabase = async (): Promise<void> => {
  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Translation.deleteMany({}),
    Order.deleteMany({}),
    LoyaltyAccount.deleteMany({}),
    LoyaltyTransaction.deleteMany({}),
    PointBucket.deleteMany({}),
    Reward.deleteMany({}),
    LoyaltyTier.deleteMany({}),
  ]);

  try {
    await Translation.collection.dropIndexes();
  } catch {
    // Collection may not exist yet on first run
  }
  await Translation.syncIndexes();
};

const seedDatabase = async (): Promise<void> => {
  const userIds: IdMap = {};

  for (const user of seedUsers) {
    const created = await User.create({
      email: user.email,
      password: SEED_PASSWORD,
      name: user.name,
      phone: user.phone,
      role: user.role,
      address: user.address,
      preferredLanguage: user.preferredLanguage,
    });
    userIds[user.key] = created._id.toString();
  }

  const restaurantIds: IdMap = {};

  for (const restaurant of seedRestaurants) {
    const created = await Restaurant.create({
      ownerId: userIds[restaurant.ownerKey],
      name: restaurant.name,
      description: restaurant.description,
      logo: restaurant.logo,
      address: restaurant.address,
      location: restaurant.location,
      cuisine: restaurant.cuisine,
      operatingHours: restaurant.operatingHours,
      contactPhone: restaurant.contactPhone,
      rating: restaurant.rating,
      averageDeliveryTime: restaurant.averageDeliveryTime,
      minimumOrderValue: restaurant.minimumOrderValue,
      isActive: true,
      localizations: restaurant.localizations,
      menuLocalizations: [],
    });
    restaurantIds[restaurant.key] = created._id.toString();
  }

  const menuItemIds: IdMap = {};

  for (const item of seedMenuItems) {
    const created = await MenuItem.create({
      restaurantId: restaurantIds[item.restaurantKey],
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      tags: [...item.tags],
      dietaryRestrictions: [...item.dietaryRestrictions],
      allergens: [...item.allergens],
      spiceLevel: item.spiceLevel,
      orderCount: item.orderCount,
      isAvailable: true,
      customizationOptions: [],
    });
    menuItemIds[item.key] = created._id.toString();

    await Restaurant.updateOne(
      { _id: restaurantIds[item.restaurantKey] },
      {
        $push: {
          menuLocalizations: {
            menuItemId: created._id,
            localizations: item.localizations,
          },
        },
      }
    );
  }

  for (const translation of seedTranslations) {
    await Translation.create(translation);
  }

  await loyaltyService.ensureDefaultTiers();
  await loyaltyService.ensureDefaultRewards();

  const priyaId = userIds.priya;
  const saravanaId = restaurantIds.saravana;
  const masalaDosaId = menuItemIds.masala_dosa;
  const filterKaapiId = menuItemIds.filter_coffee;
  const vikramId = userIds.vikram;

  const deliveredOrder = await Order.create({
    customerId: priyaId,
    restaurantId: saravanaId,
    deliveryPersonId: vikramId,
    items: [
      {
        menuItemId: masalaDosaId,
        name: 'Masala Dosa',
        quantity: 2,
        price: 120,
        customizations: [],
      },
      {
        menuItemId: filterKaapiId,
        name: 'Filter Kaapi',
        quantity: 1,
        price: 60,
        customizations: [],
      },
    ],
    subtotal: 300,
    deliveryFee: 2.99,
    tax: 24,
    total: 326.99,
    status: OrderStatus.DELIVERED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'upi',
    deliveryAddress: seedUsers.find((u) => u.key === 'priya')!.address,
    estimatedDeliveryTime: new Date(Date.now() - 30 * 60 * 1000),
    actualDeliveryTime: new Date(Date.now() - 10 * 60 * 1000),
  });

  await loyaltyService.earnPointsForOrder(deliveredOrder._id.toString());

  const pendingOrder = await Order.create({
    customerId: userIds.arjun,
    restaurantId: restaurantIds.paradise,
    items: [
      {
        menuItemId: menuItemIds.chicken_biryani,
        name: 'Hyderabadi Chicken Biryani',
        quantity: 1,
        price: 320,
        customizations: [],
      },
    ],
    subtotal: 320,
    deliveryFee: 2.99,
    tax: 25.6,
    total: 348.59,
    status: OrderStatus.CONFIRMED,
    paymentStatus: PaymentStatus.COMPLETED,
    paymentMethod: 'credit_card',
    deliveryAddress: seedUsers.find((u) => u.key === 'arjun')!.address,
    estimatedDeliveryTime: new Date(Date.now() + 35 * 60 * 1000),
  });

  await Order.findByIdAndUpdate(pendingOrder._id, {
    deliveryPersonId: vikramId,
  });

  const bronzeTier = await LoyaltyTier.findOne({ slug: 'bronze' });
  const extraPoints = 150;
  const expiresAt = new Date(Date.now() + DEFAULT_LOYALTY_POINT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await LoyaltyAccount.findOneAndUpdate(
    { userId: priyaId },
    {
      $inc: { currentBalance: extraPoints, lifetimePoints: extraPoints },
      $setOnInsert: { tierId: bronzeTier?._id },
    },
    { upsert: true, new: true }
  );

  const bonusTxn = await LoyaltyTransaction.create({
    userId: priyaId,
    type: LoyaltyTransactionType.ADJUSTMENT,
    points: extraPoints,
    balanceAfter: 476,
    description: 'Welcome bonus for Priya Sharma',
  });

  await PointBucket.create({
    userId: priyaId,
    pointsRemaining: extraPoints,
    pointsOriginal: extraPoints,
    earnedAt: new Date(),
    expiresAt,
    sourceTransactionId: bonusTxn._id,
  });

  console.log('Seed completed successfully.');
  console.log(`Password for all seeded users: ${SEED_PASSWORD}`);
  console.log('Log in via POST /api/auth/login to obtain JWT tokens.');
};

const run = async (): Promise<void> => {
  try {
    await connectDB();
    console.log('Clearing existing seed data...');
    await clearDatabase();
    console.log('Seeding database...');
    await seedDatabase();
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
    await mongoose.connection.close();
  }
};

void run();
