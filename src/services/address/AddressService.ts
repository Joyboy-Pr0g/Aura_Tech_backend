import { injectable, inject } from 'tsyringe';
import { IAddressRepository, CreateAddressDto } from '../../interfaces/repositories/IAddressRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import { CustomerAddress } from '../../models/CustomerAddress';

@injectable()
export class AddressService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAddressRepository) private addressRepo: IAddressRepository,
  ) {}

  async getMyAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.findByCustomerId(customerId);
  }

  async addAddress(customerId: string, dto: Omit<CreateAddressDto, 'customer_id'>): Promise<CustomerAddress> {
    return this.addressRepo.create({ ...dto, customer_id: customerId });
  }

  async updateAddress(customerId: string, addressId: string, dto: Partial<CreateAddressDto>): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    await this.addressRepo.update(addressId, dto);
  }

  async setDefault(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    await this.addressRepo.setDefault(customerId, addressId);
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    await this.addressRepo.softDelete(addressId);
  }
}
