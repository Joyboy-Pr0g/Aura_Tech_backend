import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAuthRepository, SafeUser } from '../../interfaces/repositories/IAuthRepository';
import { AppError } from '../../core/errors/AppError';
import { hashPassword, comparePassword } from '../../utils/password';
import { generateToken, getTokenRemainingTtl } from '../../utils/jwt';
import { getRedisClient } from '../../config/redis';
import { Role, UserStatus } from '../../types/rbac';
import { User } from '../../models/User';



@injectable()
export class AuthService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAuthRepository)
    private authRepo: IAuthRepository,
  ) {}

  async register(data: {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ token: string; user: SafeUser }> {
    if (await this.authRepo.existsByEmail(data.email)) {
      throw new AppError(409, 'Email is already registered');
    }

    if (data.phone && await this.authRepo.existsByPhone(data.phone)) {
      throw new AppError(409, 'Phone number is already registered');
    }

    const user = await this.authRepo.create({
      full_name: data.full_name,
      email: data.email,
      password_hash: await hashPassword(data.password),
      phone: data.phone ?? null,
      role: Role.CUSTOMER,
    });

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async login(data: {
    email: string;
    password: string;
  }): Promise<{ token: string; user: SafeUser }> {
    const user = await this.authRepo.findByEmail(data.email);
    if (!user) throw new AppError(401, 'Invalid credentials');

    if (user.status === UserStatus.BLOCKED) {
      throw new AppError(403, 'Your account has been blocked. Contact support.');
    }

    if (!(await comparePassword(data.password, user.password_hash))) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = generateToken({ user_id: user.id, email: user.email, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async logout(token: string): Promise<void> {
    const ttl = getTokenRemainingTtl(token);
    if (ttl > 0) {
      try {
        await getRedisClient().set(`blacklist:${token}`, '1', 'EX', ttl);
      } catch {
        console.warn('[auth] Redis unavailable — token not blacklisted');
      }
    }
  }

  async getMe(userId: string): Promise<SafeUser> {
    const user = await this.authRepo.findById(userId);
    if (!user) throw new AppError(404, 'User not found');
    return this.sanitize(user);
  }

  private sanitize(user: User): SafeUser {
    const { password_hash, ...safe } = user;
    return safe;
  }
}
