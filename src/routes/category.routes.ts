import { Router } from 'express';
import { container } from '../di/container';
import { CategoryController } from '../controllers/category/CategoryController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { upload } from '../config/multer';
import { Role } from '../types/rbac';
import { createCategorySchema, updateCategorySchema } from '../validators/product.validator';

const router = Router();
const ctrl = container.resolve(CategoryController);

// Public
router.get('/', (req, res) => ctrl.getAll(req, res));
router.get('/:id', (req, res) => ctrl.getById(req, res));

// Admin only
router.post(
  '/',
  protect,
  authorize([Role.ADMIN]),
  upload.single('image'),
  validateRequest(createCategorySchema),
  (req, res) => ctrl.create(req, res),
);
router.put(
  '/:id',
  protect,
  authorize([Role.ADMIN]),
  upload.single('image'),
  validateRequest(updateCategorySchema),
  (req, res) => ctrl.update(req, res),
);
router.delete('/:id', protect, authorize([Role.ADMIN]), (req, res) => ctrl.delete(req, res));

export default router;
