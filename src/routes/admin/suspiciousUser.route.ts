import { Router } from 'express';
import { container } from '../../di/container';
import { AdminSuspiciousUserController } from '../../controllers/admin/Admin.SuspiciousUserController';
import { validateQuery, validateRequest } from '../../middleware/validation';
import {
  suspiciousUserListSchema,
  suspiciousUserReviewSchema,
} from '../../validators/suspiciousUser.validator';

const router = Router();
const ctrl = container.resolve(AdminSuspiciousUserController);

router.get('/', validateQuery(suspiciousUserListSchema), (req, res) => ctrl.list(req, res));
router.post('/:id/dismiss', validateRequest(suspiciousUserReviewSchema), (req, res) => ctrl.dismiss(req, res));
router.post('/:id/block', validateRequest(suspiciousUserReviewSchema), (req, res) => ctrl.block(req, res));
router.post('/:id/delete-user', validateRequest(suspiciousUserReviewSchema), (req, res) => ctrl.deleteUser(req, res));

export default router;
