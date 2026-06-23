import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { User } from '../../models/User';
import { IAuthRepository, CreateUserDto } from '../../interfaces/repositories/IAuthRepository';

@injectable()
export class AuthRepository implements IAuthRepository {
  private get repo() {
    return AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.repo.save(this.repo.create(dto));
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repo.existsBy({ email });
  }

  async existsByPhone(phone: string): Promise<boolean> {
    return this.repo.existsBy({ phone });
  }
}
