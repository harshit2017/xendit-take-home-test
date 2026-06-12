import { UserRole } from '@app-types/user.types';
import { SupportedLanguage } from '@app-types/localization.types';

export const SEED_PASSWORD = 'Password@123';

export const seedUsers = [
  {
    key: 'priya',
    email: 'priya.sharma@example.com',
    name: 'Priya Sharma',
    phone: '+91-9876543210',
    role: UserRole.CUSTOMER,
    preferredLanguage: SupportedLanguage.HI,
    address: {
      street: '14 Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'IN',
    },
  },
  {
    key: 'arjun',
    email: 'arjun.patel@example.com',
    name: 'Arjun Patel',
    phone: '+91-9876543211',
    role: UserRole.CUSTOMER,
    preferredLanguage: SupportedLanguage.EN,
    address: {
      street: '22 Indiranagar 100 Feet Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560038',
      country: 'IN',
    },
  },
  {
    key: 'ravi',
    email: 'ravi.mehta@example.com',
    name: 'Ravi Mehta',
    phone: '+91-9876543212',
    role: UserRole.RESTAURANT,
    preferredLanguage: SupportedLanguage.HI,
    address: {
      street: '8 Carter Road, Bandra',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'IN',
    },
  },
  {
    key: 'kavita',
    email: 'kavita.reddy@example.com',
    name: 'Kavita Reddy',
    phone: '+91-9876543213',
    role: UserRole.RESTAURANT,
    preferredLanguage: SupportedLanguage.EN,
    address: {
      street: '5 Koramangala 5th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560095',
      country: 'IN',
    },
  },
  {
    key: 'vikram',
    email: 'vikram.singh@example.com',
    name: 'Vikram Singh',
    phone: '+91-9876543214',
    role: UserRole.DELIVERY,
    preferredLanguage: SupportedLanguage.HI,
    address: {
      street: '3 Andheri East MIDC Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400069',
      country: 'IN',
    },
  },
  {
    key: 'ananya',
    email: 'ananya.iyer@example.com',
    name: 'Ananya Iyer',
    phone: '+91-9876543215',
    role: UserRole.ADMIN,
    preferredLanguage: SupportedLanguage.EN,
    address: {
      street: '1 Admin Enclave, Powai',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400076',
      country: 'IN',
    },
  },
] as const;
