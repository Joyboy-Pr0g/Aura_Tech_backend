import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';
import { IAuthRepository, CreateUserDto, UserFilters } from '../../interfaces/repositories/IAuthRepository';
import { applyCreatedAtIdCursorDesc, CursorListResult, DEFAULT_LIMIT, paginateByCursor } from '../../utils/cursorPagination';
import { UserStatus } from '../../types/rbac';
import { IsNull } from 'typeorm';

@injectable()
export class AuthRepository implements IAuthRepository {
  private get repo() {
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email, deleted_at: IsNull() } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone, deleted_at: IsNull() } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id }, withDeleted: true });
  }
  async create(dto: CreateUserDto): Promise<User> {
    return this.repo.save(this.repo.create(dto));
  }
  async update(id: string, data: Omit<CreateUserDto, 'password_hash'>): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;
    return this.repo.save({ ...user, ...data, updated_at: new Date() });
  }
  async existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }
  async existsByPhone(phone: string): Promise<boolean> {
    return this.repo.existsBy({ phone });
  }
  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }
  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
  async activateUser(id: string): Promise<void> {
    await this.repo.update(id, { status: UserStatus.ACTIVE });
  }
  async deactivateUser(id: string): Promise<void> {
    await this.repo.update(id, { status: UserStatus.BLOCKED });
  }
  async getUsers(filters: UserFilters): Promise<CursorListResult<User>> {
    const { role, search, cursor, limit = DEFAULT_LIMIT, include_deleted } = filters;

    const qb = this.repo.createQueryBuilder('u');

    if (include_deleted) {
      console.log('include_deleted');
      qb.withDeleted();
    } else {
      qb.where('u.deleted_at IS NULL');
    }

    if (role) {
      qb.andWhere('u.role = :role', { role });
    }
    if (search) {
      qb.andWhere(
        '(LOWER(u.full_name) LIKE LOWER(:search) OR LOWER(u.email) LIKE LOWER(:search) OR LOWER(u.phone) LIKE LOWER(:search))',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    applyCreatedAtIdCursorDesc(qb, 'u', cursor ?? null);
    qb.orderBy('u.created_at', 'DESC').addOrderBy('u.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const users = rows.map(({ password_hash: _password, ...safe }) => safe as User);

    return paginateByCursor<User>(users, limit);
  }
  async resetPassword(id: string, password_hash: string): Promise<void> {
    await this.repo.update(id, { password_hash, updated_at: new Date() });
  }
  async getTotalUserCount(): Promise<number> {
    return this.repo.count();
  }
}
