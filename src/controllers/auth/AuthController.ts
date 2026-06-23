import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/AuthService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AuthController {
  constructor(
    @inject(AuthService)
    private authService: AuthService,
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.register(req.validatedData);
      res.status(201).json(APIResponse.success('Registration successful', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Registration failed'),
      );
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.authService.login(req.validatedData);
      res.status(200).json(APIResponse.success('Login successful', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Login failed'),
      );
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization!.split(' ')[1];
      await this.authService.logout(token);
      res.status(200).json(APIResponse.success('Logged out successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error('Logout failed'));
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.authService.getMe(req.user!.id);
      res.status(200).json(APIResponse.success('User fetched', user));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to fetch user'),
      );
    }
  }
}
