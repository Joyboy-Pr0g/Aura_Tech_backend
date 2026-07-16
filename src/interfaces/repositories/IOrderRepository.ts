import { Order, OrderStatus } from '../../models/Order';
import { DecodedCursor, CursorListResult } from '../../utils/cursorPagination';
import { EntityManager } from 'typeorm';

export interface CreateOrderDto {
  customer_id: string;
  shipping_address_id: string | null;
  billing_address_id: string | null;
  shipping_fee_id: string | null;
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

export interface OrderFilters {
  status?: OrderStatus;
  limit?: number;
  cursor?: DecodedCursor | null;
}

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCustomerId(
    customerId: string,
    limit: number,
    cursor: DecodedCursor | null,
  ): Promise<CursorListResult<Order>>;
  findAll(filters: OrderFilters): Promise<CursorListResult<Order>>;
  create(dto: CreateOrderDto, manager?: EntityManager): Promise<Order>;
  updateStatus(id: string, status: OrderStatus): Promise<void>;
  recordStatusHistory(
    orderId: string,
    previous: OrderStatus | null,
    next: OrderStatus,
    changedById: string | null,
    reason: string | null,
    manager?: EntityManager,
  ): Promise<void>;
  getTotalOrderCount(): Promise<number>;
}
