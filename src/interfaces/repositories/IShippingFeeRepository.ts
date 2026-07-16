import { ShippingFee } from '../../models/ShippingFee';

export interface CreateShippingFeeDto {
  price: number;
  duration: string;
  delivery_way: string;
  is_active?: boolean;
}

export interface UpdateShippingFeeDto {
  price?: number;
  duration?: string;
  delivery_way?: string;
  is_active?: boolean;
}

export interface IShippingFeeRepository {
  findAll(): Promise<ShippingFee[]>;
  findActive(): Promise<ShippingFee[]>;
  findById(id: string): Promise<ShippingFee | null>;
  create(dto: CreateShippingFeeDto): Promise<ShippingFee>;
  update(id: string, dto: UpdateShippingFeeDto): Promise<ShippingFee | null>;
  delete(id: string): Promise<void>;
  setActive(id: string, isActive: boolean): Promise<void>;
}
