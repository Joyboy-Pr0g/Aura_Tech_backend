import { Coupon } from '../../models/Coupon';
import { CouponUsage } from '../../models/CouponUsage';
import { OrderDiscount } from '../../models/OrderDiscount';
import { EntityManager } from 'typeorm';

export interface CouponValidationResult {
  coupon: Coupon;
  discountAmount: number;
}

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  findById(id: string): Promise<Coupon | null>;
  findAll(): Promise<Coupon[]>;
  create(data: Partial<Coupon>): Promise<Coupon>;
  update(id: string, data: Partial<Coupon>): Promise<Coupon>;
  delete(id: string): Promise<void>;
  recordUsage(
    couponId: string,
    customerId: string,
    orderId: string,
    discountAmount: number,
    manager?: EntityManager,
  ): Promise<void>;
  createOrderDiscount(
    orderId: string,
    couponId: string,
    discountAmount: number,
    manager?: EntityManager,
  ): Promise<void>;
}
