import { Router } from 'express';
import { container } from '../../di/container';
import { AdminProductController } from '../../controllers/admin/index';
import { validateRequest, validateQuery } from '../../middleware/validation';
import { parseMultipartJsonFields } from '../../middleware/parseMultipartJsonFields';
import { upload } from '../../config/multer';
import {
  createProductSchema,
  updateProductSchema,
  addStockSchema,
  productFiltersSchema,
  setPrimaryImageSchema,
  removeImageSchema,
} from '../../validators/product.validator';

const router = Router();
const ProductCtrl = container.resolve(AdminProductController);

router.get('/', validateQuery(productFiltersSchema), ProductCtrl.getProducts);
router.get('/:id', ProductCtrl.getProductById);
router.post(
  '/',
  upload.array('images', 10),
  parseMultipartJsonFields(['features', 'variants']),
  validateRequest(createProductSchema),
  ProductCtrl.createProduct,
);
router.put(
  '/:id',
  upload.array('images', 10),
  parseMultipartJsonFields(['features', 'deleteImagePublicIds', 'variants']),
  validateRequest(updateProductSchema),
  ProductCtrl.updateProduct,
);
router.patch('/:id/stock', validateRequest(addStockSchema), ProductCtrl.addStock);
router.delete('/:id', ProductCtrl.deleteProduct);
router.post('/:id/soft-delete', ProductCtrl.softDeleteProduct);
router.post('/:id/restore', ProductCtrl.restoreProduct);
router.post('/:id/set-primary-image', validateRequest(setPrimaryImageSchema), ProductCtrl.setPrimaryImage);
router.post('/:id/remove-image', validateRequest(removeImageSchema), ProductCtrl.removeImage);

export default router;
