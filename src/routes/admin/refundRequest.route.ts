import { Router } from 'express';
import { container } from '../../di/container';
import { AdminRefundRequestController } from '../../controllers/refund/RefundRequestController';
import { validateQuery, validateRequest } from '../../middleware/validation';
import {
  refundRequestFiltersSchema,
  rejectRefundRequestSchema,
} from '../../validators/refund.validator';

const router = Router();
const ctrl = container.resolve(AdminRefundRequestController);

router.get('/', validateQuery(refundRequestFiltersSchema), (req, res) => ctrl.list(req, res));
router.patch('/:id/approve', (req, res) => ctrl.approve(req, res));
router.patch('/:id/reject', validateRequest(rejectRefundRequestSchema), (req, res) => ctrl.reject(req, res));

export default router;
