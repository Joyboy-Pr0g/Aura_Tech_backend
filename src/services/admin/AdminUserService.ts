import { injectable, inject } from 'tsyringe';
import {
    IAuthRepository,
    AdminCreateUserDto,
    UpdateUserDto,
    UserFilters,
    SafeUser
} from '../../interfaces/repositories/IAuthRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { IEngagementRepository } from '../../interfaces/repositories/IEngagementRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import { CursorListResult, decodeCreatedAtIdCursor } from '../../utils/cursorPagination';
import { User } from '../../models/User';
import { Role } from '../../types/rbac';
import { hashPassword } from '../../utils/password';
import { sendPasswordResetEmail } from '../mail/emailService';
import { AuthService } from '../auth/AuthService';
import { Order } from '../../models/Order';
import { ProductReview } from '../../models/ProductReview';
import { ProductQuestion } from '../../models/ProductQuestion';


@injectable()
export class AdminUserService {
    constructor(
        @inject(REPOSITORY_TOKENS.IAuthRepository) private authRepo: IAuthRepository,
        @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
        @inject(REPOSITORY_TOKENS.IEngagementRepository) private engagementRepo: IEngagementRepository,
        @inject(AuthService) private authService: AuthService,
    ) { }

    /** Get users
     * @param filters UserFilters
     * @returns CursorListResult<User>
     */
    async getUsers(filters: Omit<UserFilters, 'cursor'> & { cursor?: string }): Promise<CursorListResult<User>> {
        const decoded = decodeCreatedAtIdCursor(filters.cursor ?? '');
        if (decoded === 'invalid') {
            throw new AppError(400, 'Invalid or malformed cursor');
        }
        return this.authRepo.getUsers({ ...filters, cursor: decoded });
    }
    /** Get user by id
     * @param id string
     * @returns User
     */
    async getUserById(id: string): Promise<SafeUser> {
        const user = await this.authRepo.findById(id);
        if (!user) throw new AppError(404, 'User not found');
        return this.sanitize(user);
    }

    async getUserOrders(userId: string, limit: number, cursorRaw?: string): Promise<CursorListResult<Order>> {
        await this.ensureExists(userId);
        const decoded = decodeCreatedAtIdCursor(cursorRaw);
        if (decoded === 'invalid') {
            throw new AppError(400, 'Invalid or malformed cursor');
        }
        return this.orderRepo.findByCustomerId(userId, { limit, cursor: decoded });
    }

    async getUserReviews(userId: string): Promise<ProductReview[]> {
        await this.ensureExists(userId);
        return this.engagementRepo.findReviewsByCustomerId(userId);
    }

    async getUserQuestions(userId: string): Promise<ProductQuestion[]> {
        await this.ensureExists(userId);
        return this.engagementRepo.findQuestionsByCustomerId(userId);
    }
    /** Create user
     * @param data CreateUserDto
     * @returns User
     */
    async createUser(data: AdminCreateUserDto): Promise<SafeUser> {
        const normalizedEmail = data.email.toLowerCase().trim();
        await this.authService.assertRegistrationEmailVerified(normalizedEmail);

        const existingUser = await this.authRepo.findByEmail(normalizedEmail);
        if (existingUser) throw new AppError(400, 'User with this email already exists');
        const existingUserByPhone = await this.authRepo.existsByPhone(data.phone);
        if (existingUserByPhone) throw new AppError(400, 'User with this phone already exists');
        const user = await this.authRepo.create({
            full_name: data.full_name,
            email: normalizedEmail,
            password_hash: await hashPassword(data.password),
            phone: data.phone ?? null,
            role: data.role ?? Role.CUSTOMER,
        });

        await this.authService.consumeRegistrationEmailVerification(normalizedEmail);

        return this.sanitize(user);
    }

    /** Update user
     * @param id string
     * @param data User
     * @returns User
     */
    // async updateUser(id: string, data: UpdateUserDto): Promise<SafeUser> {
    //     const user = await this.authRepo.update(id, data);
    //     if (user === null) throw new AppError(404, 'User not found');
    //     return this.sanitize(user);
    // }

    /** Activate user
     * @param id string
     * @returns void
     */
    async activateUser(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.authRepo.activateUser(id);
    }
    /** Deactivate user
     * @param id string
     * @returns void
     */
    async deactivateUser(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.authRepo.deactivateUser(id);
    }

    /** Delete user
     * @param id string
     * @returns void
     */
    async deleteUser(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.authRepo.delete(id);
    }

    /** Soft delete user
     * @param id string
     * @returns void
     */
    async softDeleteUser(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.authRepo.softDelete(id);
    }
    /** Restore user
     * @param id string
     * @returns void
     */
    async restoreUser(id: string): Promise<void> {
        await this.ensureExists(id);
        await this.authRepo.restore(id);
    }

    async resetPassword(id: string, password: string): Promise<void> {
        const user = await this.ensureExists(id);
        try {
            const password_hash = await hashPassword(password);
            await this.authRepo.resetPassword(id, password_hash);
        } catch (err) {
            throw new AppError(500, 'Failed to reset password');
        }

        try {
            await sendPasswordResetEmail(user.email, password, user.full_name);
        } catch (err) {
            throw new AppError(500, 'Failed to send password reset email');
        }
    }

    private async ensureExists(id: string): Promise<User> {
        const user = await this.authRepo.findById(id);
        if (!user) throw new AppError(404, 'User not found');
        return user;
    }

    private sanitize(user: User): SafeUser {
        const { password_hash, ...safe } = user;
        return safe;
    }

}