// src/jobs/loyalty-expiration.job.ts
import cron from 'node-cron';
import { loyaltyService } from '../services/loyalty.service';

export const startLoyaltyExpirationJob = (): void => {
  cron.schedule('0 * * * *', async () => {
    try {
      const expired = await loyaltyService.expirePoints();
      if (expired > 0) {
        console.log(`[loyalty-expiration-job] expired_buckets=${expired}`);
      }
    } catch (error) {
      console.error('[loyalty-expiration-job] failed:', error);
    }
  });
};
