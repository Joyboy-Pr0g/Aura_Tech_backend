import { User } from '../../models/User';
import { Role } from '../../types/rbac';

export interface CreateUserDto {
  full_name: string;
  email: string;
  password_hash: string;
  phone?: string | null;
  role?: Role;
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(dto: CreateUserDto): Promise<User>;
  existsByEmail(email: string): Promise<boolean>;
  existsByPhone(phone: string): Promise<boolean>;
}
