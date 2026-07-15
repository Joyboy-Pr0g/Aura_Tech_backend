import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Order, OrderStatus } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import { OrderStatusHistory } from '../../models/OrderStatusHistory';
import { IOrderRepository, CreateOrderDto, OrderFilters } from '../../interfaces/repositories/IOrderRepository';
import {
  applyCreatedAtIdCursorDesc,
  CursorListResult,
  DecodedCursor,
  DEFAULT_LIMIT,
  paginateByCursor,
} from '../../utils/cursorPagination';

@injectable()
export class OrderRepository implements IOrderRepository {
  private get repo() { return AppDataSource.getRepository(Order); }
  private get itemRepo() { return AppDataSource.getRepository(OrderItem); }
  private get historyRepo() { return AppDataSource.getRepository(OrderStatusHistory); }

  private generateOrderNumber(): string {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `AT-${datePart}-${random}`;
  }

  async findById(id: string): Promise<Order | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'items.variant', 'payment', 'customer'],
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repo.findOne({ where: { order_number: orderNumber } });
  }

  async findByCustomerId(
    customerId: string,
    limit: number,
    cursor: DecodedCursor | null,
  ): Promise<CursorListResult<Order>> {
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payment', 'payment')
      .where('o.customer_id = :customerId', { customerId });

    applyCreatedAtIdCursorDesc(qb, 'o', cursor);

    qb.orderBy('o.created_at', 'DESC')
      .addOrderBy('o.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async findAll(filters: OrderFilters): Promise<CursorListResult<Order>> {
    const { status, limit = DEFAULT_LIMIT, cursor } = filters;
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('o.payment', 'payment')
      .leftJoinAndSelect('o.customer', 'customer');

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    applyCreatedAtIdCursorDesc(qb, 'o', cursor ?? null);

    qb.orderBy('o.created_at', 'DESC')
      .addOrderBy('o.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async create(dto: CreateOrderDto): Promise<Order> {
    return AppDataSource.transaction(async (manager) => {
      const orderNumber = this.generateOrderNumber();
      const order = manager.create(Order, {
        order_number: orderNumber,
        customer_id: dto.customer_id,
        shipping_address_id: dto.shipping_address_id,
        billing_address_id: dto.billing_address_id,
        status: 'pending_payment',
        subtotal: dto.subtotal,
        discount_total: dto.discount_total,
        tax: dto.tax,
        shipping_cost: dto.shipping_cost,
        total: dto.total,
        notes: dto.notes,
      });
      const savedOrder = await manager.save(Order, order);

      const items = dto.items.map((i) =>
        manager.create(OrderItem, {
          order_id: savedOrder.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          status: 'pending',
        }),
      );
      await manager.save(OrderItem, items);
      savedOrder.items = items;
      return savedOrder;
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.repo.update(id, { status });
  }

  async recordStatusHistory(
    orderId: string,
    previous: OrderStatus | null,
    next: OrderStatus,
    changedById: string | null,
    reason: string | null,
  ): Promise<void> {
    const entry = this.historyRepo.create({
      order_id: orderId,
      previous_status: previous,
      new_status: next,
      changed_by_id: changedById,
      change_reason: reason,
    });
    await this.historyRepo.save(entry);
  }

  async getTotalOrderCount(): Promise<number> {
    return this.repo.count();
  }
}
