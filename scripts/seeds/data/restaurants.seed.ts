import { SupportedLanguage } from '@app-types/localization.types';

const defaultHours = {
  monday: { open: '09:00', close: '22:00' },
  tuesday: { open: '09:00', close: '22:00' },
  wednesday: { open: '09:00', close: '22:00' },
  thursday: { open: '09:00', close: '22:00' },
  friday: { open: '09:00', close: '23:00' },
  saturday: { open: '09:00', close: '23:00' },
  sunday: { open: '10:00', close: '22:00' },
};

export const seedRestaurants = [
  {
    key: 'saravana',
    ownerKey: 'ravi',
    name: 'Saravana Sweets & Snacks',
    description: 'Authentic South Indian tiffins, filter coffee, and Mumbai-style street snacks.',
    logo: 'https://example.com/logos/saravana.png',
    address: {
      street: '18 Hill Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400050',
      country: 'IN',
    },
    location: { type: 'Point', coordinates: [72.8267, 19.0544] },
    cuisine: ['South Indian', 'Vegetarian', 'Snacks'],
    operatingHours: defaultHours,
    contactPhone: '+91-22-26401234',
    rating: 4.6,
    averageDeliveryTime: 28,
    minimumOrderValue: 149,
    localizations: {
      [SupportedLanguage.HI]: {
        name: 'सरवणा स्वीट्स और स्नैक्स',
        description: 'प्रामाणिक दक्षिण भारतीय टिफिन, फिल्टर कॉफी और मुंबई स्टाइल स्ट्रीट स्नैक्स।',
      },
    },
  },
  {
    key: 'paradise',
    ownerKey: 'kavita',
    name: 'Paradise Biryani House',
    description: 'Hyderabadi dum biryani, kebabs, and family meal combos from Bengaluru.',
    logo: 'https://example.com/logos/paradise.png',
    address: {
      street: '12 HSR Layout Sector 2',
      city: 'Bengaluru',
      state: 'Karnataka',
      zipCode: '560102',
      country: 'IN',
    },
    location: { type: 'Point', coordinates: [77.6446, 12.9116] },
    cuisine: ['Hyderabadi', 'Biryani', 'North Indian'],
    operatingHours: defaultHours,
    contactPhone: '+91-80-45678901',
    rating: 4.8,
    averageDeliveryTime: 35,
    minimumOrderValue: 199,
    localizations: {
      [SupportedLanguage.HI]: {
        name: 'पैराडाइज बिरयानी हाउस',
        description: 'हैदराबादी दम बिरयानी, कबाब और बेंगलुरु से फैमिली मील कॉम्बो।',
      },
    },
  },
] as const;
