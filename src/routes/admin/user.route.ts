import { Router } from 'express';
import { container } from '../../di/container';
import {
    AdminUserController,
} from '../../controllers/admin/index';
import { validateRequest, validateQuery } from '../../middleware/validation';
import { userFiltersSchema, createUserSchema, updateUserSchema } from '../../validators/auth.validator';

const router = Router();
const UserCtrl = container.resolve(AdminUserController);

router.get('/', validateQuery(userFiltersSchema), UserCtrl.getUsers);
router.get('/:id', UserCtrl.getUserById);
// router.post('/', validateRequest(createUserSchema), UserCtrl.createUser);
// router.put('/:id', validateRequest(updateUserSchema), UserCtrl.updateUser);
router.delete('/:id', UserCtrl.deleteUser);
router.post('/:id/activate', UserCtrl.activateUser);
router.post('/:id/deactivate', UserCtrl.deactivateUser);
router.post('/:id/soft-delete', UserCtrl.softDeleteUser);
router.post('/:id/restore', UserCtrl.restoreUser);
router.post('/:id/reset-password', UserCtrl.resetPassword);

export default router;
