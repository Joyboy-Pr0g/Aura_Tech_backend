import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { CustomerAddress } from '../../models/CustomerAddress';
import { IAddressRepository, CreateAddressDto } from '../../interfaces/repositories/IAddressRepository';

@injectable()
export class AddressRepository implements IAddressRepository {
  private get repo() { return AppDataSource.getRepository(CustomerAddress); }

  async findByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    return this.repo.find({ where: { customer_id: customerId }, order: { is_default: 'DESC', created_at: 'ASC' } });
  }

  async findById(id: string): Promise<CustomerAddress | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateAddressDto): Promise<CustomerAddress> {
    if (dto.is_default) {
      await this.repo.update({ customer_id: dto.customer_id }, { is_default: false });
    }
    const address = this.repo.create(dto);
    return this.repo.save(address);
  }

  async update(id: string, dto: Partial<CreateAddressDto>): Promise<void> {
    await this.repo.update(id, dto);
  }

  async setDefault(customerId: string, addressId: string): Promise<void> {
    await this.repo.update({ customer_id: customerId }, { is_default: false });
    await this.repo.update(addressId, { is_default: true });
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }
}
