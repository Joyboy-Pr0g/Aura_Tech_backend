import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import {
  CreateShippingFeeDto,
  IShippingFeeRepository,
  UpdateShippingFeeDto,
} from '../../interfaces/repositories/IShippingFeeRepository';
import { AppError } from '../../core/errors/AppError';
import { ShippingFee } from '../../models/ShippingFee';

@injectable()
export class ShippingFeeService {
  constructor(
    @inject(REPOSITORY_TOKENS.IShippingFeeRepository)
    private shippingFeeRepo: IShippingFeeRepository,
  ) {}

  async getActiveFees(): Promise<ShippingFee[]> {
    return this.shippingFeeRepo.findActive();
  }

  async getAllFees(): Promise<ShippingFee[]> {
    return this.shippingFeeRepo.findAll();
  }

  async getFeeById(id: string): Promise<ShippingFee> {
    const fee = await this.shippingFeeRepo.findById(id);
    if (!fee) throw new AppError(404, 'Shipping fee not found');
    return fee;
  }

  async getActiveFeeById(id: string): Promise<ShippingFee> {
    const fee = await this.getFeeById(id);
    if (!fee.is_active) throw new AppError(400, 'Selected shipping option is not available');
    return fee;
  }

  async createFee(dto: CreateShippingFeeDto): Promise<ShippingFee> {
    return this.shippingFeeRepo.create(dto);
  }

  async updateFee(id: string, dto: UpdateShippingFeeDto): Promise<ShippingFee> {
    const updated = await this.shippingFeeRepo.update(id, dto);
    if (!updated) throw new AppError(404, 'Shipping fee not found');
    return updated;
  }

  async deleteFee(id: string): Promise<void> {
    const fee = await this.shippingFeeRepo.findById(id);
    if (!fee) throw new AppError(404, 'Shipping fee not found');
    await this.shippingFeeRepo.delete(id);
  }

  async activateFee(id: string): Promise<void> {
    const fee = await this.shippingFeeRepo.findById(id);
    if (!fee) throw new AppError(404, 'Shipping fee not found');
    await this.shippingFeeRepo.setActive(id, true);
  }

  async deactivateFee(id: string): Promise<void> {
    const fee = await this.shippingFeeRepo.findById(id);
    if (!fee) throw new AppError(404, 'Shipping fee not found');
    await this.shippingFeeRepo.setActive(id, false);
  }
}
