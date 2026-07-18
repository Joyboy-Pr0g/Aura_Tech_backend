import { Router } from 'express';
import { container } from '../../di/container';
import { AdminEngagementController } from '../../controllers/admin/Admin.EngagementController';
import { validateQuery, validateRequest } from '../../middleware/validation';
import { adminQuestionFiltersSchema, answerQuestionSchema } from '../../validators/engagement.validator';

const router = Router();
const ctrl = container.resolve(AdminEngagementController);

router.get('/', validateQuery(adminQuestionFiltersSchema), ctrl.listQuestions);
router.post('/:id/answers', validateRequest(answerQuestionSchema), ctrl.answerQuestion);

export default router;
