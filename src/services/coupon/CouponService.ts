import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ICouponRepository } from '../../interfaces/repositories/ICouponRepository';
import { Coupon } from '../../models/Coupon';
import { AppError } from '../../core/errors/AppError';
import { CouponLineItem } from '../../types/coupon';

export interface ValidateCouponResult {
  coupon: Coupon;
  discount_amount: number;
  code: string;
}

@injectable()
export class CouponService {
  constructor(
    @inject(REPOSITORY_TOKENS.ICouponRepository) private couponRepo: ICouponRepository,
  ) {}

  async validateCoupon(
    code: string,
    subtotal: number,
    items: CouponLineItem[] = [],
  ): Promise<ValidateCouponResult> {
    const coupon = await this.requireValidCouponAsync(code, subtotal, items);
    const discountBase = this.getEligibleSubtotal(coupon, items, subtotal);
    const discountAmount = this.calculateDiscount(coupon, discountBase);
    return {
      coupon,
      discount_amount: discountAmount,
      code: coupon.code,
    };
  }

  async requireValidCouponAsync(
    code: string,
    subtotal: number,
    items: CouponLineItem[] = [],
  ): Promise<Coupon> {
    const coupon = await this.couponRepo.findByCode(code);
    const discountBase = this.getEligibleSubtotal(coupon, items, subtotal);
    return this.validateCouponEntity(coupon, discountBase, items);
  }

  getEligibleSubtotal(
    coupon: Coupon | null,
    items: CouponLineItem[],
    fallbackSubtotal: number,
  ): number {
    if (!coupon) return fallbackSubtotal;
    if (!coupon.product_id && !coupon.sub_category_id && !coupon.category_id) {
      return fallbackSubtotal;
    }
    if (items.length === 0) {
      throw new AppError(400, 'Coupon requires cart items for validation');
    }

    const eligibleItems = items.filter((item) => this.isLineItemEligible(coupon, item));
    if (eligibleItems.length === 0) {
      throw new AppError(400, 'Coupon does not apply to items in your cart');
    }

    return eligibleItems.reduce((sum, item) => sum + item.line_total, 0);
  }

  isLineItemEligible(coupon: Coupon, item: CouponLineItem): boolean {
    if (coupon.product_id) {
      return item.product_id === coupon.product_id;
    }
    if (coupon.sub_category_id) {
      return item.sub_category_id === coupon.sub_category_id;
    }
    if (coupon.category_id) {
      return item.category_id === coupon.category_id;
    }
    return true;
  }

  calculateDiscount(coupon: Coupon, subtotal: number): number {
    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = subtotal * (Number(coupon.discount_value) / 100);
    } else {
      discount = Number(coupon.discount_value);
    }
    if (coupon.max_discount_amount != null) {
      discount = Math.min(discount, Number(coupon.max_discount_amount));
    }
    return Math.min(discount, subtotal);
  }

  async listCoupons(): Promise<Coupon[]> {
    return this.couponRepo.findAll();
  }

  async createCoupon(data: Partial<Coupon>): Promise<Coupon> {
    this.assertScopeFields(data);
    return this.couponRepo.create(data);
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const existing = await this.couponRepo.findById(id);
    if (!existing) throw new AppError(404, 'Coupon not found');
    this.assertScopeFields({ ...existing, ...data });
    return this.couponRepo.update(id, data);
  }

  async deleteCoupon(id: string): Promise<void> {
    const existing = await this.couponRepo.findById(id);
    if (!existing) throw new AppError(404, 'Coupon not found');
    await this.couponRepo.delete(id);
  }

  private assertScopeFields(data: Partial<Coupon>): void {
    const scopes = [data.product_id, data.sub_category_id, data.category_id].filter(Boolean);
    if (scopes.length > 1) {
      throw new AppError(400, 'Coupon can only be scoped to one of product, subcategory, or category');
    }
  }

  private validateCouponEntity(
    coupon: Coupon | null,
    subtotal: number,
    items: CouponLineItem[],
  ): Coupon {
    if (!coupon) throw new AppError(404, 'Coupon not found');
    if (!coupon.is_active) throw new AppError(400, 'Coupon is not active');
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      throw new AppError(400, 'Coupon has expired');
    }
    if (coupon.max_uses != null && coupon.current_uses >= coupon.max_uses) {
      throw new AppError(400, 'Coupon usage limit reached');
    }
    if (subtotal < Number(coupon.min_purchase_amount)) {
      throw new AppError(400, `Minimum purchase amount is ${coupon.min_purchase_amount}`);
    }
    if (coupon.product_id || coupon.sub_category_id || coupon.category_id) {
      if (items.length === 0) {
        throw new AppError(400, 'Coupon does not apply to items in your cart');
      }
      const hasEligible = items.some((item) => this.isLineItemEligible(coupon, item));
      if (!hasEligible) {
        throw new AppError(400, 'Coupon does not apply to items in your cart');
      }
    }
    return coupon;
  }
}
