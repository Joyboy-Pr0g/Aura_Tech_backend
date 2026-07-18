import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { CouponService } from '../../services/coupon/CouponService';
import { logAdminAction } from '../../utils/logAdminAction';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminCouponController {
  constructor(@inject(CouponService) private couponService: CouponService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.couponService.listCoupons();
      res.json(APIResponse.success('Coupons fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.couponService.createCoupon(req.validatedData);
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'create',
        entity_type: 'coupon',
        entity_id: data.id,
        changes_json: { code: data.code },
      });
      res.status(201).json(APIResponse.success('Coupon created', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.couponService.updateCoupon(req.params.id, req.validatedData);
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'update',
        entity_type: 'coupon',
        entity_id: req.params.id,
        changes_json: req.validatedData,
      });
      res.json(APIResponse.success('Coupon updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.couponService.deleteCoupon(req.params.id);
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'delete',
        entity_type: 'coupon',
        entity_id: req.params.id,
      });
      res.json(APIResponse.success('Coupon deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
