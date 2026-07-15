import { injectable, inject } from 'tsyringe';
import { IProductRepository } from '../../interfaces/repositories/IProductRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import {
    IAuthRepository,
} from '../../interfaces/repositories/IAuthRepository';
import { IPaymentRepository } from '../../interfaces/repositories/IPaymentRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';

interface AdminDashboardData {
    totalProducts: number;
    totalOrders: number;
    totalUsers: number;
    totalPayments: number;
}

@injectable()
export class AdminDashboardService {
    constructor(
        @inject(REPOSITORY_TOKENS.IProductRepository) private productRepo: IProductRepository,
        @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
        @inject(REPOSITORY_TOKENS.IAuthRepository) private authRepo: IAuthRepository,
        @inject(REPOSITORY_TOKENS.IPaymentRepository) private paymentRepo: IPaymentRepository,
    ) { }

    /** Admin dashboard data
     * @returns AdminDashboardData
     */
    async getAdminDashboardData(): Promise<AdminDashboardData> {
        const [totalProducts, totalOrders, totalUsers, totalPayments] = await Promise.all([
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
        };
    }
}