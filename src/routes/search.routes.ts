import { Router } from 'express';
import { container } from '../di/container';
import { SearchController } from '../controllers/search/SearchController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '../types/rbac';

const router = Router();
const ctrl = container.resolve(SearchController);

router.get('/recent', protect, authorize([Role.CUSTOMER]), (req, res) => ctrl.getRecent(req, res));

export default router;
