import { Router } from 'express';
import { container } from '../../di/container';
import { AdminBlogController } from '../../controllers/admin/Admin.BlogController';
import { validateRequest } from '../../middleware/validation';
import { upload } from '../../config/multer';
import { createBlogSchema, updateBlogSchema } from '../../validators/blog.validator';

const router = Router();
const ctrl = container.resolve(AdminBlogController);

router.get('/', (req, res) => ctrl.list(req, res));
router.get('/:id', (req, res) => ctrl.getById(req, res));
router.post('/', upload.single('cover_image'), validateRequest(createBlogSchema), (req, res) => ctrl.create(req, res));
router.put('/:id', upload.single('cover_image'), validateRequest(updateBlogSchema), (req, res) => ctrl.update(req, res));
router.delete('/:id', (req, res) => ctrl.remove(req, res));

export default router;
