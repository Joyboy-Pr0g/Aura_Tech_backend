import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminUserService } from '../../services/admin';
import { generatePassword } from '../../utils/password';

@injectable()
export class AdminUserController {
    constructor(
        @inject(AdminUserService) private adminUserService: AdminUserService,
    ) { }

    // createUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    //     try {
    //         const { full_name, email, password, phone, role } = req.validatedData;
    //         const user = await this.adminUserService.createUser({ full_name, email, password, phone, role });
    //         res.json(APIResponse.success('User created successfully', user));
    //     } catch (err) {
    //         res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    //     }
    // };
    // updateUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    //     try {
    //         const { id } = req.params;
    //         const { full_name } = req.validatedData;
    //         const user = await this.adminUserService.updateUser(id, { full_name });
    //         res.json(APIResponse.success('User updated successfully', user));
    //     } catch (err) {
    //         res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    //     }
    // }
    getUsers = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { role, search, cursor, limit, include_deleted } = req.validatedData;
            const users = await this.adminUserService.getUsers({ role, search, cursor, limit, include_deleted });
            res.json(APIResponse.success('Users fetched successfully', users));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    };
    getUserById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const user = await this.adminUserService.getUserById(id);
            res.json(APIResponse.success('User fetched successfully', user));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    activateUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.adminUserService.activateUser(id);
            res.json(APIResponse.success('User activated successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    deactivateUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.adminUserService.deactivateUser(id);
            res.json(APIResponse.success('User deactivated successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    deleteUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.adminUserService.deleteUser(id);
            res.json(APIResponse.success('User deleted successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    softDeleteUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.adminUserService.softDeleteUser(id);
            res.json(APIResponse.success('User soft deleted successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    restoreUser = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            await this.adminUserService.restoreUser(id);
            res.json(APIResponse.success('User restored successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
    resetPassword = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const password = generatePassword();
            await this.adminUserService.resetPassword(id, password);
            res.json(APIResponse.success('Password reset successfully'));
        } catch (err) {
            res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
        }
    }
}