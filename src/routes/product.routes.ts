import { Router } from 'express';
import { container } from '../di/container';
import { ProductController } from '../controllers/product/ProductController';
import { validateQuery } from '../middleware/validation';
import { listProductsQuerySchema } from '../validators/product.validator';
import { optionalProtect } from '../middleware/auth';

const router = Router();
const ctrl = container.resolve(ProductController);

// ─── Public routes ───────────────────────────────────────────────────────────
router.use(optionalProtect);
router.get('/brands', (req, res) => ctrl.brands(req, res));
router.get('/max-price', (req, res) => ctrl.maxProductPrice(req, res));

router.get('/', validateQuery(listProductsQuerySchema), (req, res) => ctrl.getMany(req, res));
router.get('/slug/:slug', (req, res) => ctrl.getBySlug(req, res));


export default router;
