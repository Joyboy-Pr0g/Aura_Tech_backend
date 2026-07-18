import { Router } from 'express';
import { container } from '../di/container';
import { VisitController } from '../controllers/visit/VisitController';
import { optionalProtect } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { logVisitSchema } from '../validators/platform.validator';

const router = Router();
const ctrl = container.resolve(VisitController);

router.post('/', optionalProtect, validateRequest(logVisitSchema), (req, res) => ctrl.log(req, res));

export default router;
