import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAnalyticsRepository } from '../../interfaces/repositories/IAnalyticsRepository';

@injectable()
export class AdminAnalyticsService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAnalyticsRepository) private analyticsRepo: IAnalyticsRepository,
  ) {}

  getDashboard() {
    return this.analyticsRepo.getDashboardAnalytics();
  }

  getRevenue(fromDate: Date, toDate: Date) {
    return this.analyticsRepo.getRevenueByDay(fromDate, toDate);
  }

  getTopProducts(limit: number) {
    return this.analyticsRepo.getTopProducts(limit);
  }

  getCustomers(sort: 'lifetime_value' | 'order_count', limit: number) {
    return Promise.all([
      this.analyticsRepo.getCustomerMetrics(),
      this.analyticsRepo.getTopCustomers(sort, limit),
    ]).then(([metrics, top_customers]) => ({ metrics, top_customers }));
  }

  getInventoryStatus() {
    return this.analyticsRepo.getInventoryStatus();
  }

  getInventoryTurnover(limit: number) {
    return this.analyticsRepo.getInventoryTurnover(limit);
  }

  getPaymentStatus() {
    return this.analyticsRepo.getPaymentStatusSummary();
  }

  getPaymentHistory(filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }) {
    return this.analyticsRepo.getPaymentHistory(filters);
  }

  getFinancialSummary(fromDate?: Date, toDate?: Date) {
    return this.analyticsRepo.getFinancialPeriodSummary(fromDate, toDate);
  }

  getExpensesHistory(filters: {
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }) {
    return this.analyticsRepo.getExpensesHistory(filters);
  }

  logVisit(data: {
    visitorId: string | null;
    customerId: string | null;
    path: string;
    referrer: string | null;
    userAgent: string | null;
  }) {
    return this.analyticsRepo.logSiteVisit(data);
  }
}
