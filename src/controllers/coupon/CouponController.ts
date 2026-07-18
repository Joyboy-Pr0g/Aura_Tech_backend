import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { CouponService } from '../../services/coupon/CouponService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class CouponController {
  constructor(@inject(CouponService) private couponService: CouponService) {}

  validate = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.couponService.validateCoupon(
        req.validatedData.code,
        req.validatedData.subtotal,
        req.validatedData.items ?? [],
      );
      res.json(APIResponse.success('Coupon valid', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
