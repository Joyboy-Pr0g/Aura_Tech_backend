import { injectable } from 'tsyringe';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Coupon } from '../../models/Coupon';
import { CouponUsage } from '../../models/CouponUsage';
import { OrderDiscount } from '../../models/OrderDiscount';
import { ICouponRepository } from '../../interfaces/repositories/ICouponRepository';

@injectable()
export class CouponRepository implements ICouponRepository {
  private repo = AppDataSource.getRepository(Coupon);

  async findByCode(code: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { code: code.toUpperCase().trim() }, relations: ['usages'] });
  }

  async findById(id: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<Coupon[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  async create(data: Partial<Coupon>): Promise<Coupon> {
    return this.repo.save(
      this.repo.create({
        ...data,
        code: String(data.code).toUpperCase().trim(),
      }),
    );
  }

  async update(id: string, data: Partial<Coupon>): Promise<Coupon> {
    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new Error('Coupon not found after update');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async recordUsage(
    couponId: string,
    customerId: string,
    orderId: string,
    discountAmount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? AppDataSource.manager;
    await em.save(CouponUsage, em.create(CouponUsage, {
      coupon_id: couponId,
      customer_id: customerId,
      order_id: orderId,
      discount_amount: discountAmount,
    }));
    await em.increment(Coupon, { id: couponId }, 'current_uses', 1);
  }

  async createOrderDiscount(
    orderId: string,
    couponId: string,
    discountAmount: number,
    manager?: EntityManager,
  ): Promise<void> {
    const em = manager ?? AppDataSource.manager;
    await em.save(OrderDiscount, em.create(OrderDiscount, {
      order_id: orderId,
      coupon_id: couponId,
      discount_type: 'coupon',
      discount_amount: discountAmount,
    }));
  }
}
