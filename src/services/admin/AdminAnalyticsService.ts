import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAnalyticsRepository } from '../../interfaces/repositories/IAnalyticsRepository';
import {
  AnalyticsPeriod,
  resolveAnalyticsDateRange,
} from '../../utils/analyticsPeriod';

export interface AnalyticsRangeInput {
  period?: AnalyticsPeriod;
  fromDate?: Date;
  toDate?: Date;
}

@injectable()
export class AdminAnalyticsService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAnalyticsRepository) private analyticsRepo: IAnalyticsRepository,
  ) {}

  private resolveRange(input: AnalyticsRangeInput) {
    return resolveAnalyticsDateRange(input);
  }

  getDashboard() {
    return this.analyticsRepo.getDashboardAnalytics();
  }

  getRevenue(input: AnalyticsRangeInput) {
    const { fromDate, toDate } = this.resolveRange(input);
    return this.analyticsRepo.getRevenueByDay(fromDate, toDate);
  }

  getTopProducts(limit: number, input?: AnalyticsRangeInput) {
    const range = input ? this.resolveRange(input) : undefined;
    return this.analyticsRepo.getTopProducts(limit, range);
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
    period?: AnalyticsPeriod;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }) {
    const { fromDate, toDate } = this.resolveRange(filters);
    return this.analyticsRepo.getPaymentHistory({
      status: filters.status,
      fromDate,
      toDate,
      limit: filters.limit,
    });
  }

  getFinancialSummary(input: AnalyticsRangeInput) {
    const { fromDate, toDate } = this.resolveRange(input);
    return this.analyticsRepo.getFinancialPeriodSummary(fromDate, toDate);
  }

  getExpensesHistory(filters: {
    period?: AnalyticsPeriod;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }) {
    const { fromDate, toDate } = this.resolveRange(filters);
    return this.analyticsRepo.getExpensesHistory({
      fromDate,
      toDate,
      limit: filters.limit,
    });
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
