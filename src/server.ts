// src/server.ts
import http from 'http';
import app from './app';
import { environment } from './config/environment';
import { initializeSocket } from './config/socket';
import { startScheduledOrderJob } from './jobs/scheduled-order.job';
import { startLoyaltyExpirationJob } from './jobs/loyalty-expiration.job';
import { loyaltyService } from './services/loyalty.service';
import { notificationService } from './services/notification.service';

const PORT = environment.port;

const server = http.createServer(app);
const io = initializeSocket(server);
notificationService.setSocketServer(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment.nodeEnv} mode`);
  console.log('WebSocket server initialized');
  startScheduledOrderJob();
  console.log('Scheduled order cron job started (runs every minute)');
  startLoyaltyExpirationJob();
  console.log('Loyalty expiration cron job started (runs every hour)');
  loyaltyService.ensureDefaultTiers().catch((error) => {
    console.error('Failed to seed loyalty tiers:', error);
  });
});
