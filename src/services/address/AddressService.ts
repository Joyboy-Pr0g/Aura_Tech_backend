import { inject, injectable } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IAddressRepository, CreateAddressDto } from '../../interfaces/repositories/IAddressRepository';
import { AppError } from '../../core/errors/AppError';
import { CustomerAddress } from '../../models/CustomerAddress';
import { UserActivityMonitorService } from '../security/UserActivityMonitorService';

@injectable()
export class AddressService {
  constructor(
    @inject(REPOSITORY_TOKENS.IAddressRepository) private addressRepo: IAddressRepository,
    @inject(UserActivityMonitorService) private activityMonitor: UserActivityMonitorService,
  ) { }

  async getMyAddresses(customerId: string): Promise<CustomerAddress[]> {
    return this.addressRepo.findByCustomerId(customerId);
  }

  async addAddress(customerId: string, dto: Omit<CreateAddressDto, 'customer_id'>): Promise<CustomerAddress> {
    const address = await this.addressRepo.create({ ...dto, customer_id: customerId });
    void this.activityMonitor.recordActivity(customerId, 'address_change');
    return address;
  }

  async updateAddress(customerId: string, addressId: string, dto: Partial<CreateAddressDto>): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    if (dto.is_default) {
      await this.addressRepo.setDefault(customerId, addressId);
    }
    await this.addressRepo.update(addressId, dto);
    void this.activityMonitor.recordActivity(customerId, 'address_change');
  }

  async setDefault(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    await this.addressRepo.setDefault(customerId, addressId);
    void this.activityMonitor.recordActivity(customerId, 'address_change');
  }

  async deleteAddress(customerId: string, addressId: string): Promise<void> {
    const address = await this.addressRepo.findById(addressId);
    if (!address || address.customer_id !== customerId) throw new AppError(404, 'Address not found');
    await this.addressRepo.softDelete(addressId);
    void this.activityMonitor.recordActivity(customerId, 'address_change');
  }
}
