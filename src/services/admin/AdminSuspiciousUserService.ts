import { inject, injectable } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ISuspiciousUserRepository } from '../../interfaces/repositories/ISuspiciousUserRepository';
import { IAuthRepository } from '../../interfaces/repositories/IAuthRepository';
import { AppError } from '../../core/errors/AppError';
import { SuspiciousUserReport, SuspiciousReportStatus } from '../../models/SuspiciousUserReport';
import { decodeCreatedAtIdCursor, CursorListResult } from '../../utils/cursorPagination';
import { AdminUserService } from './AdminUserService';

@injectable()
export class AdminSuspiciousUserService {
  constructor(
    @inject(REPOSITORY_TOKENS.ISuspiciousUserRepository)
    private suspiciousRepo: ISuspiciousUserRepository,
    @inject(REPOSITORY_TOKENS.IAuthRepository)
    private authRepo: IAuthRepository,
    @inject(AdminUserService)
    private adminUserService: AdminUserService,
  ) {}

  async listReports(filters: {
    status?: SuspiciousReportStatus;
    limit?: number;
    cursor?: string;
  }): Promise<CursorListResult<SuspiciousUserReport>> {
    const decoded = decodeCreatedAtIdCursor(filters.cursor ?? '');
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    return this.suspiciousRepo.findMany({
      status: filters.status,
      limit: filters.limit,
      cursor: decoded,
    });
  }

  async getReport(id: string): Promise<SuspiciousUserReport> {
    const report = await this.suspiciousRepo.findById(id);
    if (!report) throw new AppError(404, 'Suspicious user report not found');
    return report;
  }

  async dismissReport(id: string, adminId: string, note?: string | null): Promise<SuspiciousUserReport> {
    const report = await this.updateReportStatus(id, adminId, 'dismissed', note);
    if (!report) throw new AppError(404, 'Suspicious user report not found');
    return report;
  }

  async blockUserFromReport(id: string, adminId: string, note?: string | null): Promise<SuspiciousUserReport> {
    const existing = await this.suspiciousRepo.findById(id);
    if (!existing) throw new AppError(404, 'Suspicious user report not found');

    await this.adminUserService.deactivateUser(existing.user_id);
    const report = await this.updateReportStatus(id, adminId, 'blocked', note);
    if (!report) throw new AppError(404, 'Suspicious user report not found');
    return report;
  }

  async deleteUserFromReport(id: string, adminId: string, note?: string | null): Promise<SuspiciousUserReport> {
    const existing = await this.suspiciousRepo.findById(id);
    if (!existing) throw new AppError(404, 'Suspicious user report not found');

    await this.adminUserService.softDeleteUser(existing.user_id);
    const report = await this.updateReportStatus(id, adminId, 'deleted', note);
    if (!report) throw new AppError(404, 'Suspicious user report not found');
    return report;
  }

  async countOpenReports(): Promise<number> {
    return this.suspiciousRepo.countOpen();
  }

  private async updateReportStatus(
    id: string,
    adminId: string,
    status: SuspiciousReportStatus,
    note?: string | null,
  ): Promise<SuspiciousUserReport | null> {
    const report = await this.suspiciousRepo.findById(id);
    if (!report) return null;
    if (report.status !== 'open') {
      throw new AppError(409, 'This suspicious user report has already been reviewed');
    }

    const user = await this.authRepo.findById(report.user_id);
    if (!user) throw new AppError(404, 'User not found');

    return this.suspiciousRepo.updateStatus(id, status, adminId, note ?? null);
  }
}
