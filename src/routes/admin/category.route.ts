import { Router } from 'express';
import { container } from '../../di/container';
import { AdminCategoryController } from '../../controllers/admin/index';
import { validateRequest, validateQuery } from '../../middleware/validation';
import { upload } from '../../config/multer';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryFiltersSchema,
} from '../../validators/product.validator';

const router = Router();
const CategoryCtrl = container.resolve(AdminCategoryController);

router.get('/', validateQuery(categoryFiltersSchema), CategoryCtrl.getCategories);
router.get('/:id', CategoryCtrl.getCategoryById);
router.post('/', upload.single('image'), validateRequest(createCategorySchema), CategoryCtrl.createCategory);
router.put('/:id', upload.single('image'), validateRequest(updateCategorySchema), CategoryCtrl.updateCategory);
router.delete('/:id', CategoryCtrl.deleteCategory);
router.post('/:id/activate', CategoryCtrl.activateCategory);
router.post('/:id/deactivate', CategoryCtrl.deactivateCategory);
router.post('/:id/soft-delete', CategoryCtrl.softDeleteCategory);
router.post('/:id/restore', CategoryCtrl.restoreCategory);
router.post('/:id/unassign-parent', CategoryCtrl.unassignParentCategory);

export default router;
