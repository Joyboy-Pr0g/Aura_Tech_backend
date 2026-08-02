import { SuspiciousUserReport, SuspiciousReportStatus } from '../../models/SuspiciousUserReport';
import { CursorListResult, DecodedCursor } from '../../utils/cursorPagination';

export interface SuspiciousUserReportFilters {
  status?: SuspiciousReportStatus;
  limit?: number;
  cursor?: DecodedCursor | null;
}

export interface UpsertSuspiciousReportInput {
  userId: string;
  category: SuspiciousUserReport['category'];
  signals: SuspiciousUserReport['signals'];
  summary: string;
}

export interface ISuspiciousUserRepository {
  findMany(filters: SuspiciousUserReportFilters): Promise<CursorListResult<SuspiciousUserReport>>;
  findById(id: string): Promise<SuspiciousUserReport | null>;
  findOpenByUserId(userId: string): Promise<SuspiciousUserReport | null>;
  upsertOpenReport(input: UpsertSuspiciousReportInput): Promise<SuspiciousUserReport>;
  updateStatus(
    id: string,
    status: SuspiciousReportStatus,
    adminId: string,
    adminNote?: string | null,
  ): Promise<SuspiciousUserReport | null>;
  countOpen(): Promise<number>;
}
