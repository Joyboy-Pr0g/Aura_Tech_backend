import { Router } from 'express';
import { container } from '../../di/container';
import { AdminWebsiteSettingsController } from '../../controllers/admin/Admin.WebsiteSettingsController';
import { validateRequest } from '../../middleware/validation';
import { upload } from '../../config/multer';
import { updateWebsiteSettingsSchema } from '../../validators/websiteSettings.validator';

const router = Router();
const ctrl = container.resolve(AdminWebsiteSettingsController);

router.get('/', ctrl.getSettings);
router.patch(
  '/',
  upload.fields([
    { name: 'header_logo', maxCount: 1 },
    { name: 'footer_logo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 },
    { name: 'og_image', maxCount: 1 },
  ]),
  validateRequest(updateWebsiteSettingsSchema),
  ctrl.updateSettings,
);

export default router;
