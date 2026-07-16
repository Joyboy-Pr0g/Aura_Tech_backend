import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { Order, OrderStatus, ORDER_TRANSITIONS } from '../../models/Order';
import { ICartRepository } from '../../interfaces/repositories/ICartRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { IAddressRepository } from '../../interfaces/repositories/IAddressRepository';
import { IShippingFeeRepository } from '../../interfaces/repositories/IShippingFeeRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import { decodeCreatedAtIdCursor } from '../../utils/cursorPagination';

@injectable()
export class OrderService {
  constructor(
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
    @inject(REPOSITORY_TOKENS.ICartRepository) private cartRepo: ICartRepository,
    @inject(REPOSITORY_TOKENS.IAddressRepository) private addressRepo: IAddressRepository,
    @inject(REPOSITORY_TOKENS.IShippingFeeRepository) private shippingFeeRepo: IShippingFeeRepository,
  ) {}

  async createFromCart(
    customerId: string,
    shippingAddressId: string | null,
    billingAddressId: string | null,
    shippingFeeId: string,
    notes: string | null,
  ): Promise<Order> {
    const cart = await this.cartRepo.findByCustomerId(customerId);
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError(400, 'Cart is empty');
    }

    // Validate addresses belong to customer
    if (shippingAddressId) {
      const addr = await this.addressRepo.findById(shippingAddressId);
      if (!addr || addr.customer_id !== customerId) throw new AppError(404, 'Shipping address not found');
    }
    if (billingAddressId) {
      const addr = await this.addressRepo.findById(billingAddressId);
      if (!addr || addr.customer_id !== customerId) throw new AppError(404, 'Billing address not found');
    }

    const shippingFee = await this.shippingFeeRepo.findById(shippingFeeId);
    if (!shippingFee || !shippingFee.is_active) {
      throw new AppError(400, 'Selected shipping option is not available');
    }
    const shippingCost = Number(shippingFee.price);

    // Reserve stock inside transaction
    const order = await AppDataSource.transaction(async (manager) => {
      const productRepo = manager.getRepository(Product);
      const variantRepo = manager.getRepository(ProductVariant);

      const orderItems: Array<{
        product_id: string;
        variant_id: string | null;
        quantity: number;
        unit_price: number;
        total_price: number;
      }> = [];
      let subtotal = 0;

      for (const item of cart.items) {
        if (item.variant_id) {
          // Lock row and reserve
          const variant = await variantRepo
            .createQueryBuilder('v')
            .setLock('pessimistic_write')
            .where('v.id = :id', { id: item.variant_id })
            .getOne();
          if (!variant) throw new AppError(400, `Variant ${item.variant_id} not found`);
          const available = variant.stock_quantity - variant.reserved_quantity;
          if (available < item.quantity) {
            throw new AppError(400, `Insufficient stock for variant ${variant.sku}`);
          }
          await variantRepo.increment({ id: variant.id }, 'reserved_quantity', item.quantity);
        } else {
          const product = await productRepo
            .createQueryBuilder('p')
            .setLock('pessimistic_write')
            .where('p.id = :id', { id: item.product_id })
            .getOne();
          if (!product) throw new AppError(400, `Product ${item.product_id} not found`);
          const available = product.stock_quantity - product.reserved_quantity;
          if (available < item.quantity) {
            throw new AppError(400, `Insufficient stock for ${product.title}`);
          }
          await productRepo.increment({ id: product.id }, 'reserved_quantity', item.quantity);
        }

        const unitPrice = Number(item.price_at_time);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
      }

      const savedOrder = await this.orderRepo.create({
        customer_id: customerId,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId,
        shipping_fee_id: shippingFeeId,
        items: orderItems,
        subtotal,
        discount_total: 0,
        tax: 0,
        shipping_cost: shippingCost,
        total: subtotal + shippingCost,
        notes,
      }, manager);

      await this.orderRepo.recordStatusHistory(
        savedOrder.id,
        null,
        'pending_payment',
        customerId,
        'Order created',
        manager,
      );
      await this.cartRepo.markConverted(cart.id, manager);

      return savedOrder;
    });

    return order;
  }

  async getMyOrders(customerId: string, limit: number, cursorRaw?: string) {
    const decoded = decodeCreatedAtIdCursor(cursorRaw);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.orderRepo.findByCustomerId(customerId, limit, decoded);
  }

  async getOrderById(id: string, customerId?: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new AppError(404, 'Order not found');
    if (customerId && order.customer_id !== customerId) throw new AppError(403, 'Access denied');
    return order;
  }

  async updateStatus(
    orderId: string,
    newStatus: OrderStatus,
    adminId: string,
    reason: string | null,
  ): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new AppError(404, 'Order not found');

    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(newStatus)) {
      throw new AppError(400, `Cannot transition from ${order.status} to ${newStatus}`);
    }

    const previous = order.status;
    await this.orderRepo.updateStatus(orderId, newStatus);
    await this.orderRepo.recordStatusHistory(orderId, previous, newStatus, adminId, reason);

    // Release reserved stock if cancelled
    if (newStatus === 'cancelled') {
      await this.releaseReservedStock(order);
    }

    order.status = newStatus;
    return order;
  }

  private async releaseReservedStock(order: Order): Promise<void> {
    if (!order.items) return;
    const productRepo = AppDataSource.getRepository(Product);
    const variantRepo = AppDataSource.getRepository(ProductVariant);

    for (const item of order.items) {
      if (item.variant_id) {
        await variantRepo.decrement({ id: item.variant_id }, 'reserved_quantity', item.quantity);
      } else {
        await productRepo.decrement({ id: item.product_id }, 'reserved_quantity', item.quantity);
      }
    }
  }

  async getAdminOrders(filters: { status?: OrderStatus; limit: number; cursor?: string }) {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.orderRepo.findAll({
      status: filters.status,
      limit: filters.limit,
      cursor: decoded,
    });
  }
}
