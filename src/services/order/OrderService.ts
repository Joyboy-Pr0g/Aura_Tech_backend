import { injectable, inject } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Product } from '../../models/Product';
import { ProductVariant } from '../../models/ProductVariant';
import { Order, OrderStatus, OrderPaymentType, ORDER_TRANSITIONS } from '../../models/Order';
import { ICartRepository } from '../../interfaces/repositories/ICartRepository';
import { IOrderRepository } from '../../interfaces/repositories/IOrderRepository';
import { IAddressRepository } from '../../interfaces/repositories/IAddressRepository';
import { IShippingFeeRepository } from '../../interfaces/repositories/IShippingFeeRepository';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { AppError } from '../../core/errors/AppError';
import { decodeCreatedAtIdCursor } from '../../utils/cursorPagination';
import { CouponService } from '../coupon/CouponService';
import { ICouponRepository } from '../../interfaces/repositories/ICouponRepository';
import { CouponLineItem } from '../../types/coupon';
import { NotificationService } from '../notification/NotificationService';
import { notificationMessages } from '../../i18n/notification-messages';
import { IInventoryRepository } from '../../interfaces/repositories/IInventoryRepository';
import { logAdminAction } from '../../utils/logAdminAction';

@injectable()
export class OrderService {
  constructor(
    @inject(REPOSITORY_TOKENS.IOrderRepository) private orderRepo: IOrderRepository,
    @inject(REPOSITORY_TOKENS.ICartRepository) private cartRepo: ICartRepository,
    @inject(REPOSITORY_TOKENS.IAddressRepository) private addressRepo: IAddressRepository,
    @inject(REPOSITORY_TOKENS.IShippingFeeRepository) private shippingFeeRepo: IShippingFeeRepository,
    @inject(CouponService) private couponService: CouponService,
    @inject(REPOSITORY_TOKENS.ICouponRepository) private couponRepo: ICouponRepository,
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(REPOSITORY_TOKENS.IInventoryRepository) private inventoryRepo: IInventoryRepository,
  ) {}

  async createFromCart(
    customerId: string,
    shippingAddressId: string | null,
    billingAddressId: string | null,
    shippingFeeId: string,
    notes: string | null,
    paymentType: OrderPaymentType = 'bank_transfer',
    couponCode: string | null = null,
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
    if (paymentType !== 'bank_transfer' && paymentType !== 'pay_on_delivery') {
      throw new AppError(400, 'Invalid payment type');
    }

    const shippingCost = Number(shippingFee.price);
    const initialStatus: OrderStatus = paymentType === 'pay_on_delivery' ? 'processing' : 'pending_payment';

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
      const couponLineItems: CouponLineItem[] = [];
      let subtotal = 0;

      for (const item of cart.items) {
        let productForCoupon: Product | null = null;
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
          productForCoupon = await productRepo.findOne({ where: { id: item.product_id } });
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
          productForCoupon = product;
        }

        const unitPrice = Number(item.price_at_time);
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        if (productForCoupon) {
          couponLineItems.push({
            product_id: productForCoupon.id,
            category_id: productForCoupon.category_id,
            sub_category_id: productForCoupon.sub_category_id,
            line_total: totalPrice,
          });
        }

        orderItems.push({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });
      }

      let discountTotal = 0;
      let couponId: string | null = null;
      if (couponCode) {
        const coupon = await this.couponService.requireValidCouponAsync(couponCode, subtotal, customerId, couponLineItems);
        const discountBase = this.couponService.getEligibleSubtotal(coupon, couponLineItems, subtotal);
        discountTotal = this.couponService.calculateDiscount(coupon, discountBase);
        couponId = coupon.id;
      }

      const total = Math.max(0, subtotal - discountTotal + shippingCost);

      const savedOrder = await this.orderRepo.create({
        customer_id: customerId,
        shipping_address_id: shippingAddressId,
        billing_address_id: billingAddressId,
        shipping_fee_id: shippingFeeId,
        payment_type: paymentType,
        initial_status: initialStatus,
        items: orderItems,
        subtotal,
        discount_total: discountTotal,
        tax: 0,
        shipping_cost: shippingCost,
        total,
        notes,
      }, manager);

      if (couponId && discountTotal > 0) {
        await this.couponRepo.createOrderDiscount(savedOrder.id, couponId, discountTotal, manager);
        await this.couponRepo.recordUsage(couponId, customerId, savedOrder.id, discountTotal, manager);
      }

      await this.orderRepo.recordStatusHistory(
        savedOrder.id,
        null,
        initialStatus,
        customerId,
        paymentType === 'pay_on_delivery' ? 'Pay on delivery order placed' : 'Order created',
        manager,
      );
      await this.cartRepo.markConverted(cart.id, manager);

      return { savedOrder, orderItems };
    });

    for (const item of order.orderItems) {
      await this.inventoryRepo.logChange({
        productId: item.product_id,
        variantId: item.variant_id,
        quantityChange: -item.quantity,
        reason: 'order_placed',
        referenceId: order.savedOrder.id,
        changedById: customerId,
      });
    }

    const orderConfirmation = notificationMessages.orderConfirmation(order.savedOrder.order_number);
    void this.notificationService.notifyCustomer({
      customerId,
      type: orderConfirmation.type,
      title: orderConfirmation.title,
      message: orderConfirmation.message,
      relatedOrderId: order.savedOrder.id,
    });

    const staffNewOrder = notificationMessages.staffNewOrder(order.savedOrder.order_number);
    void this.notificationService.notifyStaff({
      type: staffNewOrder.type,
      title: staffNewOrder.title,
      message: staffNewOrder.message,
      relatedOrderId: order.savedOrder.id,
    });

    const fullOrder = await this.orderRepo.findById(order.savedOrder.id);
    return fullOrder ?? order.savedOrder;
  }

  async getMyOrders(
    customerId: string,
    filters: { status?: OrderStatus; search?: string; limit: number; cursor?: string },
  ) {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.orderRepo.findByCustomerId(customerId, {
      status: filters.status,
      search: filters.search,
      limit: filters.limit,
      cursor: decoded,
    });
  }

  async getOrderByCustomerIdAndOrderNumber(customerId: string, orderNumber: string): Promise<Order> {
    const order = await this.orderRepo.findByCustomerIdAndOrderNumber(customerId, orderNumber);
    if (!order) throw new AppError(404, 'Order not found');
    return order;
  }

  async getOrderById(id: string, customerId?: string): Promise<Order> {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new AppError(404, 'Order not found');
    if (customerId && order.customer_id !== customerId) throw new AppError(403, 'Access denied');
    return order;
  }

  async getStatusHistory(orderId: string, customerId?: string) {
    await this.getOrderById(orderId, customerId);
    return this.orderRepo.findStatusHistory(orderId);
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

    void logAdminAction({
      admin_id: adminId,
      action: 'status_change',
      entity_type: 'order',
      entity_id: orderId,
      changes_json: { from: previous, to: newStatus },
      reason: reason ?? undefined,
    });

    if (newStatus === 'cancelled') {
      await this.releaseReservedStock(order);
    }

    void this.notifyCustomerOfStatusChange(order, previous, newStatus, reason);

    order.status = newStatus;
    return order;
  }

  private notifyCustomerOfStatusChange(
    order: Order,
    previous: OrderStatus,
    newStatus: OrderStatus,
    reason: string | null,
  ): void {
    const payload = notificationMessages.orderStatusChange(order.order_number, newStatus, reason);
    if (!payload || previous === newStatus) return;

    void this.notificationService.notifyCustomer({
      customerId: order.customer_id,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      relatedOrderId: order.id,
    });
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

  async getAdminOrders(filters: { status?: OrderStatus; search?: string; limit: number; cursor?: string }) {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.orderRepo.findAll({
      status: filters.status,
      search: filters.search,
      limit: filters.limit,
      cursor: decoded,
    });
  }
}
