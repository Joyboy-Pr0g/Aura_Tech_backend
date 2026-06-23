import { Router } from 'express';
import { container } from '../di/container';
import { AuthController } from '../controllers/auth/AuthController';
import { validateRequest } from '../middleware/validation';
import { protect } from '../middleware/auth';
import { registerSchema, loginSchema } from '../validators/auth.validator';

const router = Router();
const ctrl = container.resolve(AuthController);

router.post('/register', validateRequest(registerSchema), (req, res) => ctrl.register(req, res));
router.post('/login', validateRequest(loginSchema), (req, res) => ctrl.login(req, res));
router.post('/logout', protect, (req, res) => ctrl.logout(req, res));
router.get('/me', protect, (req, res) => ctrl.me(req, res));

export default router;
