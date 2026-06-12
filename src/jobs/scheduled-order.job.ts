// src/jobs/scheduled-order.job.ts
import cron from 'node-cron';
import { SchedulingService } from '../services/scheduling.service';

const schedulingService = new SchedulingService();

export const startScheduledOrderJob = (): void => {
  cron.schedule('* * * * *', async () => {
    try {
      const processed = await schedulingService.processDueScheduledOrders();
      const notified = await schedulingService.sendUpcomingNotifications();

      if (processed > 0 || notified > 0) {
        console.log(
          `[scheduled-order-job] processed=${processed} upcoming_notifications=${notified}`
        );
      }
    } catch (error) {
      console.error('[scheduled-order-job] failed:', error);
    }
  });
};
