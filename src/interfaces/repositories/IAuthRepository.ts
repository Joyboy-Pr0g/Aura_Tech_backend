import { User } from '../../models/User';
import { Role } from '../../types/rbac';
import { CursorListResult, DecodedCursor } from '../../utils/cursorPagination';

export interface CreateUserDto {
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  role?: Role;
}
export interface UpdateUserDto {
  full_name: string;
}
export interface AdminCreateUserDto {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface UserFilters {
  role?: Role;
  search?: string;
  cursor: DecodedCursor | null;
  limit?: number;
  include_deleted?: boolean;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  update(id: string, data: Partial<CreateUserDto>): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  activateUser(id: string): Promise<void>;
  deactivateUser(id: string): Promise<void>;
  getUsers(filters: UserFilters): Promise<CursorListResult<User>>;
  getTotalUserCount(): Promise<number>;
  resetPassword(id: string, password_hash: string): Promise<void>;
}
