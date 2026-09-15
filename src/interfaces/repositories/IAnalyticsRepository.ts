export interface RevenueByDayRow {
  day: string;
  revenue: number;
  order_count: number;
}

export interface TopProductRow {
  id: string;
  title: string;
  sales: number;
  revenue: number;
}

export interface CustomerMetrics {
  total_customers: number;
  paying_customers: number;
  avg_order_value: number;
}

export interface TopCustomerRow {
  customer_id: string;
  email: string;
  full_name: string | null;
  order_count: number;
  lifetime_value: number;
}

export interface InventoryStatus {
  total_products: number;
  low_stock: number;
  out_of_stock: number;
}

export interface InventoryTurnoverRow {
  product_id: string;
  title: string;
  sold_quantity: number;
  current_stock: number;
  turnover_rate: number;
}

export interface PaymentStatusSummary {
  pending_count: number;
  approved_today: number;
  payments_received_today: number;
  payments_received_total: number;
  expenses_today: number;
  expenses_total: number;
  expenses_company_total: number;
  expenses_refund_total: number;
  net_profit_total: number;
  /** @deprecated use payments_received_total */
  total_revenue: number;
}

export interface FinancialPeriodSummary {
  payments_received: number;
  expenses_total: number;
  expenses_company: number;
  expenses_refund: number;
  net_profit: number;
}

export interface ExpenseHistoryRow {
  id: string;
  type: string;
  amount: number;
  reason: string;
  receipt_url: string;
  created_at: string;
  order_number: string | null;
}

export interface VisitorMetrics {
  visitors_today: number;
  visitors_week: number;
  unique_visitors_today: number;
}

export interface DashboardAnalytics {
  revenue_today: number;
  orders_today: number;
  revenue_week: number;
  payments_received_today: number;
  payments_received_week: number;
  expenses_today: number;
  expenses_week: number;
  profit_today: number;
  profit_week: number;
  top_products: TopProductRow[];
  top_customers: TopCustomerRow[];
  customer_metrics: CustomerMetrics;
  inventory_status: InventoryStatus;
  payment_status: PaymentStatusSummary;
  visitor_metrics: VisitorMetrics;
  trending_count: number;
}

export interface IAnalyticsRepository {
  getDashboardAnalytics(): Promise<DashboardAnalytics>;
  getRevenueByDay(fromDate: Date, toDate: Date): Promise<RevenueByDayRow[]>;
  getTopProducts(limit: number, range?: { fromDate: Date; toDate: Date }): Promise<TopProductRow[]>;
  getCustomerMetrics(): Promise<CustomerMetrics>;
  getTopCustomers(sort: 'lifetime_value' | 'order_count', limit: number): Promise<TopCustomerRow[]>;
  getInventoryStatus(): Promise<InventoryStatus>;
  getInventoryTurnover(limit: number): Promise<InventoryTurnoverRow[]>;
  getPaymentStatusSummary(): Promise<PaymentStatusSummary>;
  getPaymentHistory(filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }): Promise<Array<Record<string, unknown>>>;
  getFinancialPeriodSummary(fromDate?: Date, toDate?: Date): Promise<FinancialPeriodSummary>;
  getExpensesHistory(filters: {
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }): Promise<ExpenseHistoryRow[]>;
  logSiteVisit(data: {
    visitorId: string | null;
    customerId: string | null;
    path: string;
    referrer: string | null;
    userAgent: string | null;
  }): Promise<void>;
}
