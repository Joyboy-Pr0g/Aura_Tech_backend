import { Router } from 'express';
import { container } from '../di/container';
import { WebsiteSettingsController } from '../controllers/websiteSettings/WebsiteSettingsController';

const router = Router();
const ctrl = container.resolve(WebsiteSettingsController);

router.get('/', ctrl.getSettings);

export default router;
