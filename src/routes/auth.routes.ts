import { Router } from 'express';
import { container } from '../di/container';
import { AuthController } from '../controllers/auth/AuthController';
import { validateRequest } from '../middleware/validation';
import { protect } from '../middleware/auth';
import { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema, sendEmailVerificationSchema, verifyEmailChangeSchema, forgotPasswordSchema } from '../validators/auth.validator';

const router = Router();
const ctrl = container.resolve(AuthController);

router.post('/register', validateRequest(registerSchema), (req, res) => ctrl.register(req, res));
router.post('/login', validateRequest(loginSchema), (req, res) => ctrl.login(req, res));
router.post('/registration/email-verification/send', validateRequest(sendEmailVerificationSchema), (req, res) => ctrl.sendRegistrationEmailVerificationCode(req, res));
router.post('/registration/email-verification/verify', validateRequest(verifyEmailChangeSchema), (req, res) => ctrl.verifyRegistrationEmailCode(req, res));
router.post('/forgot-password', validateRequest(forgotPasswordSchema), (req, res) => ctrl.forgotPassword(req, res));
router.post('/logout', protect, (req, res) => ctrl.logout(req, res));
router.get('/me', protect, (req, res) => ctrl.me(req, res));
router.patch('/me', protect, validateRequest(updateProfileSchema), (req, res) => ctrl.updateProfile(req, res));
router.patch('/password', protect, validateRequest(changePasswordSchema), (req, res) => ctrl.changePassword(req, res));
router.post('/email-verification/send', protect, validateRequest(sendEmailVerificationSchema), (req, res) => ctrl.sendEmailVerificationCode(req, res));
router.post('/email-verification/verify', protect, validateRequest(verifyEmailChangeSchema), (req, res) => ctrl.verifyEmailChangeCode(req, res));

export default router;
