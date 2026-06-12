module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    // Task 1: Advanced Search and Filtering
    'src/utils/search.utils.ts',
    'src/services/restaurant.service.ts',
    'src/services/menu.service.ts',
    'src/models/restaurant.model.ts',
    'src/models/menu.model.ts',
    // Task 2: Order Scheduling
    'src/utils/scheduling.utils.ts',
    'src/services/scheduling.service.ts',
    'src/models/order.model.ts',
    'src/models/notification.model.ts',
    // Task 4: Real-time Notifications
    'src/services/notification.service.ts',
    'src/config/socket.ts',
    // Task 3: Loyalty Program
    'src/utils/loyalty.utils.ts',
    'src/services/loyalty.service.ts',
    // Task 5: Analytics
    'src/services/analytics.service.ts',
    // Bonus: Multi-language
    'src/utils/language.utils.ts',
    'src/utils/localization.utils.ts',
    'src/services/translation.service.ts',
  ],
  coverageThreshold: {
    './src/utils/search.utils.ts': {
      branches: 60,
      functions: 90,
      lines: 80,
      statements: 80,
    },
    './src/services/restaurant.service.ts': {
      branches: 20,
      functions: 20,
      lines: 35,
      statements: 35,
    },
    './src/services/menu.service.ts': {
      branches: 45,
      functions: 10,
      lines: 40,
      statements: 40,
    },
    './src/models/restaurant.model.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/models/menu.model.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/utils/scheduling.utils.ts': {
      branches: 50,
      functions: 80,
      lines: 70,
      statements: 70,
    },
    './src/services/scheduling.service.ts': {
      branches: 20,
      functions: 35,
      lines: 35,
      statements: 35,
    },
    './src/models/order.model.ts': {
      branches: 100,
      functions: 0,
      lines: 90,
      statements: 90,
    },
    './src/models/notification.model.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/services/notification.service.ts': {
      branches: 25,
      functions: 50,
      lines: 55,
      statements: 55,
    },
    './src/config/socket.ts': {
      branches: 30,
      functions: 50,
      lines: 50,
      statements: 50,
    },
    './src/utils/loyalty.utils.ts': {
      branches: 60,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/services/loyalty.service.ts': {
      branches: 15,
      functions: 25,
      lines: 30,
      statements: 30,
    },
    './src/utils/language.utils.ts': {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/localization.utils.ts': {
      branches: 60,
      functions: 65,
      lines: 80,
      statements: 80,
    },
    './src/services/analytics.service.ts': {
      branches: 10,
      functions: 15,
      lines: 20,
      statements: 20,
    },
    './src/services/translation.service.ts': {
      branches: 10,
      functions: 15,
      lines: 20,
      statements: 20,
    },
  },
};
