import { injectable, inject } from 'tsyringe';
import { AdminAnalyticsService } from './AdminAnalyticsService';
import { IProductRepository } from '../../interfaces/repositories/IProductRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppDataSource } from '../../config/database';

@injectable()
export class AdminDashboardService {
    constructor(
        @inject(AdminAnalyticsService) private analyticsService: AdminAnalyticsService,
        @inject(REPOSITORY_TOKENS.IProductRepository) private productRepo: IProductRepository,
        @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
        @inject(REPOSITORY_TOKENS.IAuthRepository) private authRepo: IAuthRepository,
        @inject(REPOSITORY_TOKENS.IPaymentRepository) private paymentRepo: IPaymentRepository,
    ) { }

    async getNavBadges() {
        const rows = await AppDataSource.query(
            `SELECT
               (SELECT COUNT(*)::int FROM orders
                WHERE status IN ('pending_payment', 'payment_confirmed', 'processing', 'shipment_ready')) AS pending_orders,
               (SELECT COUNT(*)::int FROM payments WHERE status = 'pending') AS pending_payments,
               (SELECT COUNT(*)::int FROM product_questions q
                WHERE NOT EXISTS (
                  SELECT 1 FROM question_answers a WHERE a.question_id = q.id
                )) AS unanswered_questions,
               (SELECT COUNT(*)::int FROM refund_requests WHERE status = 'pending') AS pending_refunds`,
        );
        const row = rows[0] ?? {};
        return {
            pending_orders: Number(row.pending_orders ?? 0),
            pending_payments: Number(row.pending_payments ?? 0),
            unanswered_questions: Number(row.unanswered_questions ?? 0),
            pending_refunds: Number(row.pending_refunds ?? 0),
        };
    }

    async getAdminDashboardData() {
        const [analytics, totalProducts, totalOrders, totalUsers, totalPayments] = await Promise.all([
            this.analyticsService.getDashboard(),
            this.productRepo.getTotalProductCount(),
            this.orderRepo.getTotalOrderCount(),
            this.authRepo.getTotalUserCount(),
            this.paymentRepo.getTotalPayment(),
        ]);
        return {
            totalProducts,
            totalOrders,
            totalUsers,
            totalPayments,
            analytics,
        };
    }
}