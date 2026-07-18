import { Router } from 'express';
import { container } from '../../di/container';
import { AdminActionLogController } from '../../controllers/admin/Admin.ActionLogController';
import { validateQuery } from '../../middleware/validation';
import { latestActionLogsSchema } from '../../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(AdminActionLogController);

router.get('/latest', validateQuery(latestActionLogsSchema), (req, res) => ctrl.latest(req, res));

export default router;
