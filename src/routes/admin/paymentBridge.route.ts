import { Router } from 'express';
import { container } from '../../di/container';
import { AdminPaymentBridgeController } from '../../controllers/paymentBridge/AdminPaymentBridgeController';
import { validateRequest } from '../../middleware/validation';
import {
  createPaymentProviderSchema,
  registerPaymentDeviceSchema,
  updatePaymentDeviceSchema,
  updatePaymentProviderSchema,
} from '../../validators/paymentBridge.validator';

const router = Router();
const ctrl = container.resolve(AdminPaymentBridgeController);

router.get('/devices', (req, res) => ctrl.listDevices(req, res));
router.post('/devices', validateRequest(registerPaymentDeviceSchema), (req, res) => ctrl.registerDevice(req, res));
router.patch('/devices/:id', validateRequest(updatePaymentDeviceSchema), (req, res) => ctrl.updateDevice(req, res));
router.delete('/devices/:id', (req, res) => ctrl.deleteDevice(req, res));

router.get('/providers', (req, res) => ctrl.listProviders(req, res));
router.post('/providers', validateRequest(createPaymentProviderSchema), (req, res) => ctrl.createProvider(req, res));
router.patch('/providers/:id', validateRequest(updatePaymentProviderSchema), (req, res) => ctrl.updateProvider(req, res));
router.delete('/providers/:id', (req, res) => ctrl.deleteProvider(req, res));

export default router;
