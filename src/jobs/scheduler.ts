import cron from 'node-cron';
import { container } from '../di/container';
import { TrendingService } from '../services/trending/TrendingService';
import { NotificationService } from '../services/notification/NotificationService';
import { PaymentVerificationService } from '../services/paymentBridge/PaymentVerificationService';

export function startScheduledJobs(): void {
  const trendingService = container.resolve(TrendingService);
  const notificationService = container.resolve(NotificationService);
  const paymentVerificationService = container.resolve(PaymentVerificationService);

  cron.schedule('0 1 * * *', () => {
    console.time('Calculating trending.....');
    void trendingService.calculateTrending().catch((err) => {
      console.error('Trending calculation failed:', err);
    }).finally(() => {
      console.timeEnd('Calculating trending.....');
    });
  });

  cron.schedule('*/5 * * * *', () => {
    void notificationService.retryFailedNotifications().catch((err) => {
      console.error('Notification retry failed:', err);
    });
  });

  cron.schedule('0 * * * *', () => {
    void notificationService.processBackInStockReminders().catch((err) => {
      console.error('Stock reminder job failed:', err);
    });
  });

  cron.schedule('* * * * *', () => {
    void paymentVerificationService.processExpiredVerifications().catch((err) => {
      console.error('Payment verify expiry job failed:', err);
    });
  });

  console.log('   Cron     : trending (1 AM), notifications (5 min), reminders (hourly), payment verify expiry (1 min)');
}
