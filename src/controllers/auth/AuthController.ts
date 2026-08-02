import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AuthService } from '../../services/auth/AuthService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { getRequestIp } from '../../utils/authRateLimit';

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

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.authService.updateProfile(req.user!.id, req.validatedData);
      res.status(200).json(APIResponse.success('Profile updated', user));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to update profile'),
      );
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { current_password, new_password } = req.validatedData;
      await this.authService.changePassword(req.user!.id, { current_password, new_password });
      res.status(200).json(APIResponse.success('Password changed successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to change password'),
      );
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.validatedData;
      await this.authService.resetPassword(email, password);
      res.status(200).json(APIResponse.success('Password reset successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to reset password'),
      );
    }
  }

  async sendRegistrationEmailVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      await this.authService.sendRegistrationEmailVerificationCode(
        req.validatedData.email,
        getRequestIp(req),
      );
      res.status(200).json(APIResponse.success('Verification code sent'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to send verification code'),
      );
    }
  }

  async verifyRegistrationEmailCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.validatedData;
      await this.authService.verifyRegistrationEmailCode(email, code, getRequestIp(req));
      res.status(200).json(APIResponse.success('Email verified successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to verify email'),
      );
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      await this.authService.requestPasswordReset(req.validatedData.email, getRequestIp(req));
      res.status(200).json(APIResponse.success('If an account exists for this email, a new password has been sent'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to process password reset request'),
      );
    }
  }

  async sendEmailVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      await this.authService.sendEmailVerificationCode(
        req.user!.id,
        req.validatedData.email,
        getRequestIp(req),
      );
      res.status(200).json(APIResponse.success('Verification code sent'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to send verification code'),
      );
    }
  }

  async verifyEmailChangeCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.validatedData;
      await this.authService.verifyEmailChangeCode(req.user!.id, email, code, getRequestIp(req));
      res.status(200).json(APIResponse.success('Email verified successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(
        APIResponse.error(err instanceof Error ? err.message : 'Failed to verify email'),
      );
    }
  }
}
