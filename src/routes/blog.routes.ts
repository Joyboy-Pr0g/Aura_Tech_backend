import { Router } from 'express';
import { container } from '../di/container';
import { BlogController } from '../controllers/blog/BlogController';

const router = Router();
const ctrl = container.resolve(BlogController);

router.get('/', (req, res) => ctrl.list(req, res));
router.get('/slug/:slug', (req, res) => ctrl.getBySlug(req, res));

export default router;
