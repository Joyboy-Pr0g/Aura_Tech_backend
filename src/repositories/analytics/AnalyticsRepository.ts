import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { SiteVisit } from '../../models/SiteVisit';
import {
  CustomerMetrics,
  DashboardAnalytics,
  IAnalyticsRepository,
  InventoryStatus,
  InventoryTurnoverRow,
  PaymentStatusSummary,
  RevenueByDayRow,
  TopCustomerRow,
  TopProductRow,
  VisitorMetrics,
  FinancialPeriodSummary,
  ExpenseHistoryRow,
} from '../../interfaces/repositories/IAnalyticsRepository';

const CONFIRMED_STATUSES = [
  'payment_confirmed',
  'processing',
  'ready_to_ship',
  'shipped',
  'delivered',
];

const APPROVED_PAYMENT_STATUSES = ['approved', 'manual_approved'];

@injectable()
export class AnalyticsRepository implements IAnalyticsRepository {
  private visitRepo = AppDataSource.getRepository(SiteVisit);

  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const [
      revenueTodayRow,
      ordersTodayRow,
      revenueWeekRow,
      paymentsTodayRow,
      paymentsWeekRow,
      expensesTodayRow,
      expensesWeekRow,
      top_products,
      top_customers,
      customer_metrics,
      inventory_status,
      payment_status,
      visitor_metrics,
      trending_count,
    ] = await Promise.all([
      AppDataSource.query(
        `SELECT COALESCE(SUM(total), 0)::float AS revenue
         FROM orders
         WHERE status = ANY($1)
           AND DATE(created_at) = CURRENT_DATE`,
        [CONFIRMED_STATUSES],
      ),
      AppDataSource.query(
        `SELECT COUNT(*)::int AS count FROM orders WHERE DATE(created_at) = CURRENT_DATE`,
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(total), 0)::float AS revenue
         FROM orders
         WHERE status = ANY($1)
           AND created_at >= NOW() - INTERVAL '7 days'`,
        [CONFIRMED_STATUSES],
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM payments
         WHERE status = ANY($1)
           AND DATE(COALESCE(approved_at, updated_at)) = CURRENT_DATE`,
        [APPROVED_PAYMENT_STATUSES],
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM payments
         WHERE status = ANY($1)
           AND COALESCE(approved_at, updated_at) >= NOW() - INTERVAL '7 days'`,
        [APPROVED_PAYMENT_STATUSES],
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM expenses
         WHERE DATE(created_at) = CURRENT_DATE`,
      ),
      AppDataSource.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM expenses
         WHERE created_at >= NOW() - INTERVAL '7 days'`,
      ),
      this.getTopProducts(5),
      this.getTopCustomers('lifetime_value', 5),
      this.getCustomerMetrics(),
      this.getInventoryStatus(),
      this.getPaymentStatusSummary(),
      this.getVisitorMetrics(),
      AppDataSource.query(`SELECT COUNT(*)::int AS count FROM trending_products`),
    ]);

    const paymentsReceivedToday = Number(paymentsTodayRow[0]?.total ?? 0);
    const paymentsReceivedWeek = Number(paymentsWeekRow[0]?.total ?? 0);
    const expensesToday = Number(expensesTodayRow[0]?.total ?? 0);
    const expensesWeek = Number(expensesWeekRow[0]?.total ?? 0);

    return {
      revenue_today: Number(revenueTodayRow[0]?.revenue ?? 0),
      orders_today: Number(ordersTodayRow[0]?.count ?? 0),
      revenue_week: Number(revenueWeekRow[0]?.revenue ?? 0),
      payments_received_today: paymentsReceivedToday,
      payments_received_week: paymentsReceivedWeek,
      expenses_today: expensesToday,
      expenses_week: expensesWeek,
      profit_today: paymentsReceivedToday - expensesToday,
      profit_week: paymentsReceivedWeek - expensesWeek,
      top_products,
      top_customers,
      customer_metrics,
      inventory_status,
      payment_status,
      visitor_metrics,
      trending_count: Number(trending_count[0]?.count ?? 0),
    };
  }

  async getRevenueByDay(fromDate: Date, toDate: Date): Promise<RevenueByDayRow[]> {
    const rows = await AppDataSource.query(
      `SELECT DATE(o.created_at) AS day,
              SUM(o.total)::float AS revenue,
              COUNT(o.id)::int AS order_count
       FROM orders o
       WHERE o.status = ANY($1)
         AND o.created_at >= $2
         AND o.created_at <= $3
       GROUP BY DATE(o.created_at)
       ORDER BY day DESC`,
      [CONFIRMED_STATUSES, fromDate, toDate],
    );
    return rows.map((r: RevenueByDayRow) => ({
      day: r.day,
      revenue: Number(r.revenue),
      order_count: Number(r.order_count),
    }));
  }

  async getTopProducts(limit: number): Promise<TopProductRow[]> {
    const rows = await AppDataSource.query(
      `SELECT p.id, p.title,
              COUNT(oi.id)::int AS sales,
              SUM(oi.total_price)::float AS revenue
       FROM products p
       JOIN order_items oi ON p.id = oi.product_id
       JOIN orders o ON o.id = oi.order_id
       WHERE o.status = ANY($1)
       GROUP BY p.id, p.title
       ORDER BY sales DESC
       LIMIT $2`,
      [CONFIRMED_STATUSES, limit],
    );
    return rows.map((r: TopProductRow) => ({
      id: r.id,
      title: r.title,
      sales: Number(r.sales),
      revenue: Number(r.revenue),
    }));
  }

  async getCustomerMetrics(): Promise<CustomerMetrics> {
    const rows = await AppDataSource.query(
      `SELECT COUNT(DISTINCT customer_id)::int AS total_customers,
              COUNT(DISTINCT CASE WHEN status = 'delivered' THEN customer_id END)::int AS paying_customers,
              COALESCE(AVG(total), 0)::float AS avg_order_value
       FROM orders`,
    );
    const r = rows[0] ?? {};
    return {
      total_customers: Number(r.total_customers ?? 0),
      paying_customers: Number(r.paying_customers ?? 0),
      avg_order_value: Number(r.avg_order_value ?? 0),
    };
  }

  async getTopCustomers(
    sort: 'lifetime_value' | 'order_count',
    limit: number,
  ): Promise<TopCustomerRow[]> {
    const orderBy = sort === 'order_count' ? 'order_count DESC' : 'lifetime_value DESC';
    const rows = await AppDataSource.query(
      `SELECT u.id AS customer_id, u.email, u.full_name,
              COUNT(o.id)::int AS order_count,
              COALESCE(SUM(o.total), 0)::float AS lifetime_value
       FROM users u
       JOIN orders o ON o.customer_id = u.id
       WHERE o.status = ANY($1)
       GROUP BY u.id, u.email, u.full_name
       ORDER BY ${orderBy}
       LIMIT $2`,
      [CONFIRMED_STATUSES, limit],
    );
    return rows.map((r: TopCustomerRow) => ({
      customer_id: r.customer_id,
      email: r.email,
      full_name: r.full_name,
      order_count: Number(r.order_count),
      lifetime_value: Number(r.lifetime_value),
    }));
  }

  async getInventoryStatus(): Promise<InventoryStatus> {
    const rows = await AppDataSource.query(
      `SELECT COUNT(*)::int AS total_products,
              COUNT(*) FILTER (WHERE stock_quantity > 0 AND stock_quantity <= 5)::int AS low_stock,
              COUNT(*) FILTER (WHERE stock_quantity <= 0)::int AS out_of_stock
       FROM products
       WHERE deleted_at IS NULL`,
    );
    const r = rows[0] ?? {};
    return {
      total_products: Number(r.total_products ?? 0),
      low_stock: Number(r.low_stock ?? 0),
      out_of_stock: Number(r.out_of_stock ?? 0),
    };
  }

  async getInventoryTurnover(limit: number): Promise<InventoryTurnoverRow[]> {
    const rows = await AppDataSource.query(
      `SELECT p.id AS product_id, p.title,
              COALESCE(SUM(oi.quantity), 0)::int AS sold_quantity,
              p.stock_quantity AS current_stock,
              CASE WHEN p.stock_quantity > 0
                   THEN COALESCE(SUM(oi.quantity), 0)::float / p.stock_quantity
                   ELSE COALESCE(SUM(oi.quantity), 0)::float
              END AS turnover_rate
       FROM products p
       LEFT JOIN order_items oi ON oi.product_id = p.id
       LEFT JOIN orders o ON o.id = oi.order_id AND o.status = ANY($1)
       WHERE p.deleted_at IS NULL
       GROUP BY p.id, p.title, p.stock_quantity
       ORDER BY turnover_rate DESC
       LIMIT $2`,
      [CONFIRMED_STATUSES, limit],
    );
    return rows.map((r: InventoryTurnoverRow) => ({
      product_id: r.product_id,
      title: r.title,
      sold_quantity: Number(r.sold_quantity),
      current_stock: Number(r.current_stock),
      turnover_rate: Number(r.turnover_rate),
    }));
  }

  async getPaymentStatusSummary(): Promise<PaymentStatusSummary> {
    const rows = await AppDataSource.query(
      `SELECT
         (SELECT COUNT(*)::int FROM payments WHERE status = 'pending') AS pending_count,
         (SELECT COUNT(*)::int FROM payments
          WHERE status = ANY($1)
            AND DATE(COALESCE(approved_at, updated_at)) = CURRENT_DATE) AS approved_today,
         (SELECT COALESCE(SUM(amount), 0)::float FROM payments
          WHERE status = ANY($1)
            AND DATE(COALESCE(approved_at, updated_at)) = CURRENT_DATE) AS payments_received_today,
         (SELECT COALESCE(SUM(amount), 0)::float FROM payments
          WHERE status = ANY($1)) AS payments_received_total,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses
          WHERE DATE(created_at) = CURRENT_DATE) AS expenses_today,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses) AS expenses_total,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses WHERE type = 'expense') AS expenses_company_total,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses WHERE type = 'refund') AS expenses_refund_total`,
      [APPROVED_PAYMENT_STATUSES],
    );
    const r = rows[0] ?? {};
    const paymentsReceivedTotal = Number(r.payments_received_total ?? 0);
    const expensesTotal = Number(r.expenses_total ?? 0);
    return {
      pending_count: Number(r.pending_count ?? 0),
      approved_today: Number(r.approved_today ?? 0),
      payments_received_today: Number(r.payments_received_today ?? 0),
      payments_received_total: paymentsReceivedTotal,
      expenses_today: Number(r.expenses_today ?? 0),
      expenses_total: expensesTotal,
      expenses_company_total: Number(r.expenses_company_total ?? 0),
      expenses_refund_total: Number(r.expenses_refund_total ?? 0),
      net_profit_total: paymentsReceivedTotal - expensesTotal,
      total_revenue: paymentsReceivedTotal,
    };
  }

  async getFinancialPeriodSummary(fromDate?: Date, toDate?: Date): Promise<FinancialPeriodSummary> {
    const paymentClauses = [`status = ANY($1)`];
    const expenseClauses: string[] = [];
    const params: unknown[] = [APPROVED_PAYMENT_STATUSES];
    let paramIndex = 2;

    if (fromDate) {
      paymentClauses.push(`COALESCE(approved_at, updated_at) >= $${paramIndex}`);
      expenseClauses.push(`created_at >= $${paramIndex}`);
      params.push(fromDate);
      paramIndex++;
    }
    if (toDate) {
      paymentClauses.push(`COALESCE(approved_at, updated_at) <= $${paramIndex}`);
      expenseClauses.push(`created_at <= $${paramIndex}`);
      params.push(toDate);
      paramIndex++;
    }

    const expenseWhere = expenseClauses.length > 0 ? `WHERE ${expenseClauses.join(' AND ')}` : '';

    const rows = await AppDataSource.query(
      `SELECT
         (SELECT COALESCE(SUM(amount), 0)::float FROM payments WHERE ${paymentClauses.join(' AND ')}) AS payments_received,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses ${expenseWhere}) AS expenses_total,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses ${expenseWhere}${expenseWhere ? ' AND' : 'WHERE'} type = 'expense') AS expenses_company,
         (SELECT COALESCE(SUM(amount), 0)::float FROM expenses ${expenseWhere}${expenseWhere ? ' AND' : 'WHERE'} type = 'refund') AS expenses_refund`,
      params,
    );

    const r = rows[0] ?? {};
    const paymentsReceived = Number(r.payments_received ?? 0);
    const expensesTotal = Number(r.expenses_total ?? 0);
    return {
      payments_received: paymentsReceived,
      expenses_total: expensesTotal,
      expenses_company: Number(r.expenses_company ?? 0),
      expenses_refund: Number(r.expenses_refund ?? 0),
      net_profit: paymentsReceived - expensesTotal,
    };
  }

  async getExpensesHistory(filters: {
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }): Promise<ExpenseHistoryRow[]> {
    const params: unknown[] = [];
    const clauses: string[] = ['1=1'];

    if (filters.fromDate) {
      params.push(filters.fromDate);
      clauses.push(`e.created_at >= $${params.length}`);
    }
    if (filters.toDate) {
      params.push(filters.toDate);
      clauses.push(`e.created_at <= $${params.length}`);
    }
    params.push(filters.limit);

    const rows = await AppDataSource.query(
      `SELECT e.id, e.type, e.amount, e.reason, e.receipt_url, e.created_at, o.order_number
       FROM expenses e
       LEFT JOIN orders o ON o.id = e.order_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY e.created_at DESC
       LIMIT $${params.length}`,
      params,
    );

    return rows.map((r: ExpenseHistoryRow) => ({
      id: r.id,
      type: r.type,
      amount: Number(r.amount),
      reason: r.reason,
      receipt_url: r.receipt_url,
      created_at: r.created_at,
      order_number: r.order_number ?? null,
    }));
  }

  async getPaymentHistory(filters: {
    status?: string;
    fromDate?: Date;
    toDate?: Date;
    limit: number;
  }): Promise<Array<Record<string, unknown>>> {
    const params: unknown[] = [];
    const clauses: string[] = ['1=1'];

    if (filters.status) {
      params.push(filters.status);
      clauses.push(`p.status = $${params.length}`);
    }
    if (filters.fromDate) {
      params.push(filters.fromDate);
      clauses.push(`p.created_at >= $${params.length}`);
    }
    if (filters.toDate) {
      params.push(filters.toDate);
      clauses.push(`p.created_at <= $${params.length}`);
    }
    params.push(filters.limit);

    return AppDataSource.query(
      `SELECT p.*, o.order_number
       FROM payments p
       JOIN orders o ON o.id = p.order_id
       WHERE ${clauses.join(' AND ')}
       ORDER BY p.created_at DESC
       LIMIT $${params.length}`,
      params,
    );
  }

  private async getVisitorMetrics(): Promise<VisitorMetrics> {
    const rows = await AppDataSource.query(
      `SELECT
         COUNT(*) FILTER (WHERE visited_at >= CURRENT_DATE)::int AS visitors_today,
         COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '7 days')::int AS visitors_week,
         COUNT(DISTINCT COALESCE(visitor_id, customer_id::text))
           FILTER (WHERE visited_at >= CURRENT_DATE)::int AS unique_visitors_today
       FROM site_visits`,
    );
    const r = rows[0] ?? {};
    return {
      visitors_today: Number(r.visitors_today ?? 0),
      visitors_week: Number(r.visitors_week ?? 0),
      unique_visitors_today: Number(r.unique_visitors_today ?? 0),
    };
  }

  async logSiteVisit(data: {
    visitorId: string | null;
    customerId: string | null;
    path: string;
    referrer: string | null;
    userAgent: string | null;
  }): Promise<void> {
    await this.visitRepo.save(
      this.visitRepo.create({
        visitor_id: data.visitorId,
        customer_id: data.customerId,
        path: data.path,
        referrer: data.referrer,
        user_agent: data.userAgent,
        visited_at: new Date(),
      }),
    );
  }
}
