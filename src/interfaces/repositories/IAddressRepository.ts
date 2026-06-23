import { CustomerAddress } from '../../models/CustomerAddress';

export interface CreateAddressDto {
  customer_id: string;
  label: string;
  full_name: string;
  phone: string;
  city: string;
  governorate: string;
  district?: string;
  street_address: string;
  postal_code?: string;
  type?: 'shipping' | 'billing' | 'both';
  is_default?: boolean;
}

export interface IAddressRepository {
  findByCustomerId(customerId: string): Promise<CustomerAddress[]>;
  findById(id: string): Promise<CustomerAddress | null>;
  create(dto: CreateAddressDto): Promise<CustomerAddress>;
  update(id: string, dto: Partial<CreateAddressDto>): Promise<void>;
  setDefault(customerId: string, addressId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
}
