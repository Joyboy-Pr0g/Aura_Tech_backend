import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import {
  ISuspiciousUserRepository,
  SuspiciousUserReportFilters,
  UpsertSuspiciousReportInput,
} from '../../interfaces/repositories/ISuspiciousUserRepository';
import { SuspiciousUserReport, SuspiciousReportStatus } from '../../models/SuspiciousUserReport';
import {
  DEFAULT_LIMIT,
  paginateByCursor,
} from '../../utils/cursorPagination';

@injectable()
export class SuspiciousUserRepository implements ISuspiciousUserRepository {
  private get repo() {
    return AppDataSource.getRepository(SuspiciousUserReport);
  }

  async findMany(filters: SuspiciousUserReportFilters) {
    const limit = filters.limit ?? DEFAULT_LIMIT;
    const qb = this.repo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.reviewed_by_admin', 'reviewed_by_admin');

    if (filters.status) {
      qb.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters.cursor) {
      qb.andWhere(
        `(report.last_detected_at < :c_at OR (report.last_detected_at = :c_at_eq AND report.id < :c_id))`,
        {
          c_at: filters.cursor.created_at,
          c_at_eq: filters.cursor.created_at,
          c_id: filters.cursor.id,
        },
      );
    }

    qb.orderBy('report.last_detected_at', 'DESC').addOrderBy('report.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    return paginateByCursor(rows, limit, undefined, (item) => ({
      created_at: item.last_detected_at,
      id: item.id,
    }));
  }

  async findById(id: string): Promise<SuspiciousUserReport | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user', 'reviewed_by_admin'],
    });
  }

  async findOpenByUserId(userId: string): Promise<SuspiciousUserReport | null> {
    return this.repo.findOne({
      where: { user_id: userId, status: 'open' },
      relations: ['user'],
    });
  }

  async upsertOpenReport(input: UpsertSuspiciousReportInput): Promise<SuspiciousUserReport> {
    const existing = await this.findOpenByUserId(input.userId);
    const now = new Date();

    if (existing) {
      existing.category = input.category;
      existing.signals = input.signals;
      existing.summary = input.summary;
      existing.last_detected_at = now;
      return this.repo.save(existing);
    }

    const report = this.repo.create({
      user_id: input.userId,
      category: input.category,
      status: 'open',
      signals: input.signals,
      summary: input.summary,
      last_detected_at: now,
    });
    return this.repo.save(report);
  }

  async updateStatus(
    id: string,
    status: SuspiciousReportStatus,
    adminId: string,
    adminNote?: string | null,
  ): Promise<SuspiciousUserReport | null> {
    const report = await this.findById(id);
    if (!report) return null;

    report.status = status;
    report.reviewed_by_admin_id = adminId;
    report.reviewed_at = new Date();
    report.admin_note = adminNote ?? null;
    return this.repo.save(report);
  }

  async countOpen(): Promise<number> {
    return this.repo.count({ where: { status: 'open' } });
  }
}
