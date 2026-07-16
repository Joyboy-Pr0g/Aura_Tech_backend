import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { ShippingFee } from '../../models/ShippingFee';
import {
  CreateShippingFeeDto,
  IShippingFeeRepository,
  UpdateShippingFeeDto,
} from '../../interfaces/repositories/IShippingFeeRepository';

@injectable()
export class ShippingFeeRepository implements IShippingFeeRepository {
  private get repo() {
    return AppDataSource.getRepository(ShippingFee);
  }

  async findAll(): Promise<ShippingFee[]> {
    return this.repo.find({ order: { created_at: 'ASC' } });
  }

  async findActive(): Promise<ShippingFee[]> {
    return this.repo.find({
      where: { is_active: true },
      order: { created_at: 'ASC' },
    });
  }

  async findById(id: string): Promise<ShippingFee | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateShippingFeeDto): Promise<ShippingFee> {
    const fee = this.repo.create({
      price: dto.price,
      duration: dto.duration,
      delivery_way: dto.delivery_way,
      is_active: dto.is_active ?? true,
    });
    return this.repo.save(fee);
  }

  async update(id: string, dto: UpdateShippingFeeDto): Promise<ShippingFee | null> {
    const fee = await this.findById(id);
    if (!fee) return null;
    return this.repo.save({ ...fee, ...dto, updated_at: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async setActive(id: string, isActive: boolean): Promise<void> {
    await this.repo.update(id, { is_active: isActive, updated_at: new Date() });
  }
}
