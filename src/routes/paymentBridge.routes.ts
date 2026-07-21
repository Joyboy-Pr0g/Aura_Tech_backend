import { Router } from 'express';
import { container } from '../di/container';
import { PaymentBridgeController } from '../controllers/paymentBridge/PaymentBridgeController';
import { PaymentDeviceAuthService, createAuthenticatePaymentDevice } from '../middleware/paymentDeviceAuth';
import { validateRequest } from '../middleware/validation';
import { ingestPaymentEventSchema } from '../validators/paymentBridge.validator';

const router = Router();
const ctrl = container.resolve(PaymentBridgeController);
const authService = container.resolve(PaymentDeviceAuthService);
const authenticatePaymentDevice = createAuthenticatePaymentDevice(authService);

router.get(
  '/payment-bridge/providers',
  authenticatePaymentDevice,
  (req, res) => ctrl.getProviders(req, res),
);

router.post(
  '/payment-events',
  authenticatePaymentDevice,
  validateRequest(ingestPaymentEventSchema),
  (req, res) => ctrl.ingestEvent(req, res),
);

router.post(
  '/payment-bridge/ping',
  authenticatePaymentDevice,
  (req, res) => ctrl.ping(req, res),
);

export default router;
