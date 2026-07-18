import { Router } from 'express';
import { container } from '../di/container';
import { NotificationController } from '../controllers/notification/NotificationController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';
import { validateRequest } from '../middleware/validation';
import { deviceTokenSchema } from '../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(NotificationController);
const inboxRoles = [protect, authorize([Role.CUSTOMER, Role.ADMIN, Role.SUB_ADMIN])];
const pushTokenRoles = [protect, authorize([Role.CUSTOMER, Role.ADMIN, Role.SUB_ADMIN])];

router.post('/device-tokens', ...pushTokenRoles, validateRequest(deviceTokenSchema), (req, res) => ctrl.registerDevice(req, res));
router.get('/', ...inboxRoles, (req, res) => ctrl.list(req, res));
router.patch('/:id/read', ...inboxRoles, (req, res) => ctrl.markRead(req, res));

export default router;
