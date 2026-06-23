import { AppDataSource } from '../config/database';
import { AdminActionLog } from '../models/AdminActionLog';

interface LogAdminActionDto {
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes_json?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
}

export async function logAdminAction(dto: LogAdminActionDto): Promise<void> {
  try {
    const repo = AppDataSource.getRepository(AdminActionLog);
    await repo.save(repo.create(dto));
  } catch (err) {
    console.error('Failed to log admin action:', err);
  }
}
