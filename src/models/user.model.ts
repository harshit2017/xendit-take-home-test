// src/models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, UserRole, IUserDocument } from '../types/user.types';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '../types/notification.types';
import { DEFAULT_LANGUAGE, SupportedLanguage } from '../types/localization.types';

const userSchema: Schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    notificationPreferences: {
      order: {
        statusUpdates: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.order.statusUpdates },
        deliveryTracking: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.order.deliveryTracking },
        restaurantMessages: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.order.restaurantMessages },
        scheduledReminders: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.order.scheduledReminders },
      },
      loyalty: {
        enabled: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.loyalty.enabled },
      },
      promotion: {
        enabled: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.promotion.enabled },
      },
      system: {
        enabled: { type: Boolean, default: DEFAULT_NOTIFICATION_PREFERENCES.system.enabled },
      },
    },
    preferredLanguage: {
      type: String,
      enum: Object.values(SupportedLanguage),
      default: DEFAULT_LANGUAGE,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre<IUserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUserDocument>('User', userSchema);

export default User;
