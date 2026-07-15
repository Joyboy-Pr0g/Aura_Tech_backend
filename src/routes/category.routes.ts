import { Router } from 'express';
import { container } from '../di/container';
import { CategoryController } from '../controllers/category/CategoryController';

const router = Router();
const ctrl = container.resolve(CategoryController);

// Public
router.get('/', (req, res) => ctrl.getAll(req, res));
router.get('/:id', (req, res) => ctrl.getById(req, res));
router.get('/slug/:slug', (req, res) => ctrl.getBySlug(req, res));

export default router;
