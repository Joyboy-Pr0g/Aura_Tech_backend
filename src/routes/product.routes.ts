import { Router } from 'express';
import { container } from '../di/container';
import { ProductController } from '../controllers/product/ProductController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { upload } from '../config/multer';
import { Role } from '../types/rbac';
import {
  createProductSchema,
  updateProductSchema,
  addStockSchema,
} from '../validators/product.validator';

const router = Router();
const ctrl = container.resolve(ProductController);

// ─── Public routes ───────────────────────────────────────────────────────────
router.get('/', (req, res) => ctrl.getMany(req, res));
router.get('/slug/:slug', (req, res) => ctrl.getBySlug(req, res));
router.get('/:id', (req, res) => ctrl.getById(req, res));

// ─── Admin routes ────────────────────────────────────────────────────────────
router.post(
  '/',
  protect,
  authorize([Role.ADMIN, Role.SUB_ADMIN]),
  upload.array('images', 10),
  validateRequest(createProductSchema),
  (req, res) => ctrl.create(req, res),
);

router.put(
  '/:id',
  protect,
  authorize([Role.ADMIN, Role.SUB_ADMIN]),
  upload.array('images', 10),
  validateRequest(updateProductSchema),
  (req, res) => ctrl.update(req, res),
);

router.patch(
  '/:id/stock',
  protect,
  authorize([Role.ADMIN, Role.SUB_ADMIN]),
  validateRequest(addStockSchema),
  (req, res) => ctrl.addStock(req, res),
);

router.delete(
  '/:id',
  protect,
  authorize([Role.ADMIN]),
  (req, res) => ctrl.delete(req, res),
);

export default router;
