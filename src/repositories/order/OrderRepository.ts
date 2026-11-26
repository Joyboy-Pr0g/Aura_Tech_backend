import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Order, OrderStatus } from '../../models/Order';
import { OrderItem } from '../../models/OrderItem';
import { OrderStatusHistory } from '../../models/OrderStatusHistory';
import { IOrderRepository, CreateOrderDto, OrderFilters } from '../../interfaces/repositories/IOrderRepository';
import { EntityManager } from 'typeorm';
import {
  applyCreatedAtIdCursorDesc,
  CursorListResult,
  DEFAULT_LIMIT,
  paginateByCursor,
} from '../../utils/cursorPagination';
import { joinUserColumns, USER_CONTACT_COLUMNS } from '../../utils/publicUser';

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
      relations: ['items', 'items.product', 'items.variant', 'payment', 'payment.payment_method', 'customer', 'shipping_fee', 'shipping_address'],
    });
  }

  async findByCustomerIdAndOrderNumber(customerId: string, orderNumber: string): Promise<Order | null> {
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('o.payment', 'payment')
      .leftJoinAndSelect('payment.payment_method', 'payment_method')
      .leftJoinAndSelect('o.shipping_fee', 'shipping_fee')
      .leftJoinAndSelect('o.shipping_address', 'shipping_address')
      .where('o.customer_id = :customerId', { customerId })
      .andWhere('o.order_number = :orderNumber', { orderNumber });
    return joinUserColumns(qb, 'o.customer', 'customer', USER_CONTACT_COLUMNS).getOne();
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    return this.repo.findOne({ where: { order_number: orderNumber } });
  }

  async findByCustomerId(
    customerId: string,
    filters: OrderFilters,
  ): Promise<CursorListResult<Order>> {
    const { status, search, limit = DEFAULT_LIMIT, cursor } = filters;
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('o.payment', 'payment')
      .leftJoinAndSelect('o.shipping_fee', 'shipping_fee')
      .where('o.customer_id = :customerId', { customerId });

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    if (search?.trim()) {
      qb.andWhere(
        `(LOWER(o.order_number) LIKE LOWER(:search)
          OR LOWER(product.title) LIKE LOWER(:search))`,
        { search: `%${search.trim()}%` },
      );
    }

    applyCreatedAtIdCursorDesc(qb, 'o', cursor ?? null);

    qb.distinct(true)
      .orderBy('o.created_at', 'DESC')
      .addOrderBy('o.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async findAll(filters: OrderFilters): Promise<CursorListResult<Order>> {
    const { status, search, limit = DEFAULT_LIMIT, cursor } = filters;
    const qb = this.repo
      .createQueryBuilder('o')
      .leftJoinAndSelect('o.customer', 'customer')
      .leftJoinAndSelect('o.payment', 'payment');

    if (status) {
      qb.andWhere('o.status = :status', { status });
    }

    if (search?.trim()) {
      qb.andWhere(
        `(LOWER(o.order_number) LIKE LOWER(:search)
          OR LOWER(customer.full_name) LIKE LOWER(:search)
          OR LOWER(customer.email) LIKE LOWER(:search))`,
        { search: `%${search.trim()}%` },
      );
    }

    applyCreatedAtIdCursorDesc(qb, 'o', cursor ?? null);

    qb.orderBy('o.created_at', 'DESC')
      .addOrderBy('o.id', 'DESC')
      .take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit);
  }

  async create(dto: CreateOrderDto, manager?: EntityManager): Promise<Order> {
    const run = async (mgr: EntityManager) => {
      const orderNumber = this.generateOrderNumber();
      const order = mgr.create(Order, {
        order_number: orderNumber,
        customer_id: dto.customer_id,
        shipping_address_id: dto.shipping_address_id,
        billing_address_id: dto.billing_address_id,
        shipping_fee_id: dto.shipping_fee_id,
        status: dto.initial_status ?? 'pending_payment',
        payment_type: dto.payment_type ?? 'bank_transfer',
        subtotal: dto.subtotal,
        discount_total: dto.discount_total,
        tax: dto.tax,
        shipping_cost: dto.shipping_cost,
        total: dto.total,
        notes: dto.notes,
      });
      const savedOrder = await mgr.save(Order, order);

      const items = dto.items.map((i) =>
        mgr.create(OrderItem, {
          order_id: savedOrder.id,
          product_id: i.product_id,
          variant_id: i.variant_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          total_price: i.total_price,
          status: 'pending',
        }),
      );
      await mgr.save(OrderItem, items);
      savedOrder.items = items;
      return savedOrder;
    };

    if (manager) return run(manager);
    return AppDataSource.transaction(run);
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
    manager?: EntityManager,
  ): Promise<void> {
    const historyRepo = manager?.getRepository(OrderStatusHistory) ?? this.historyRepo;
    const entry = historyRepo.create({
      order_id: orderId,
      previous_status: previous,
      new_status: next,
      changed_by_id: changedById,
      change_reason: reason,
    });
    await historyRepo.save(entry);
  }

  async findStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    return this.historyRepo.find({
      where: { order_id: orderId },
      order: { created_at: 'ASC' },
    });
  }

  async getTotalOrderCount(): Promise<number> {
    return this.repo.count();
  }
}
