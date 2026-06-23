import { Order, OrderStatus } from '../../models/Order';

export interface CreateOrderDto {
  customer_id: string;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  items: Array<{
    product_id: string;
    variant_id: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  discount_total: number;
  tax: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCustomerId(customerId: string, page: number, limit: number): Promise<[Order[], number]>;
  findAll(filters: { status?: OrderStatus; page: number; limit: number }): Promise<[Order[], number]>;
  create(dto: CreateOrderDto): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  recordStatusHistory(orderId: string, previous: OrderStatus | null, next: OrderStatus, changedById: string | null, reason: string | null): Promise<void>;
}
