// src/types/user.types.ts
import { INotificationPreferences } from './notification.types';
import { SupportedLanguage } from './localization.types';

export enum UserRole {
  CUSTOMER = 'customer',
  RESTAURANT = 'restaurant',
  DELIVERY = 'delivery',
  ADMIN = 'admin'
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IUser {
  _id?: string;
  email: string;
  password: string;
  name: string;
  phone: string;
  address: IAddress;
  role: UserRole;
  notificationPreferences?: INotificationPreferences;
  preferredLanguage?: SupportedLanguage;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
  isModified(password: string): Promise<boolean>;
}
