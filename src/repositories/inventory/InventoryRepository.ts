import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { InventoryLog, InventoryReason } from '../../models/InventoryLog';
import { AdminActionLog } from '../../models/AdminActionLog';
import {
  IInventoryRepository,
  InventoryLogFilters,
} from '../../interfaces/repositories/IInventoryRepository';

@injectable()
export class InventoryRepository implements IInventoryRepository {
  private repo = AppDataSource.getRepository(InventoryLog);

  async logChange(data: {
    productId: string;
    variantId?: string | null;
    quantityChange: number;
    reason: InventoryReason;
    referenceId?: string | null;
    changedById?: string | null;
    notes?: string | null;
  }): Promise<InventoryLog> {
    return this.repo.save(
      this.repo.create({
        product_id: data.productId,
        variant_id: data.variantId ?? null,
        quantity_change: data.quantityChange,
        reason: data.reason,
        reference_id: data.referenceId ?? null,
        changed_by_id: data.changedById ?? null,
        notes: data.notes ?? null,
      }),
    );
  }

  async findLogs(filters: InventoryLogFilters): Promise<InventoryLog[]> {
    const qb = this.repo
      .createQueryBuilder('il')
      .leftJoinAndSelect('il.product', 'product')
      .leftJoinAndSelect('il.variant', 'variant')
      .leftJoinAndSelect('il.changed_by', 'changed_by')
      .orderBy('il.created_at', 'DESC')
      .take(filters.limit ?? 50);

    if (filters.productId) {
      qb.andWhere('il.product_id = :productId', { productId: filters.productId });
    }
    if (filters.reason) {
      qb.andWhere('il.reason = :reason', { reason: filters.reason });
    }
    if (filters.changedById) {
      qb.andWhere('il.changed_by_id = :changedById', { changedById: filters.changedById });
    }
    if (filters.cursor) {
      qb.andWhere(
        '(il.created_at < :createdAt OR (il.created_at = :createdAt AND il.id < :id))',
        { createdAt: filters.cursor.createdAt, id: filters.cursor.id },
      );
    }

    return qb.getMany();
  }

  async findActionLogsForEntity(
    entityType: string,
    entityId: string,
    limit = 10,
  ): Promise<Array<Record<string, unknown>>> {
    const rows = await AppDataSource.getRepository(AdminActionLog)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.admin', 'admin')
      .where('a.entity_type = :entityType', { entityType })
      .andWhere('a.entity_id = :entityId', { entityId })
      .orderBy('a.created_at', 'DESC')
      .take(limit)
      .getMany();

    return rows.map((r) => ({
      id: r.id,
      action: r.action,
      admin_id: r.admin_id,
      admin_email: r.admin?.email ?? null,
      admin_name: r.admin?.full_name ?? null,
      changes_json: r.changes_json,
      reason: r.reason,
      created_at: r.created_at,
    }));
  }

  async findLatestActionsForEntities(
    entityType: string,
    entityIds: string[],
  ): Promise<Array<{
    entity_id: string;
    action: string;
    admin_email: string | null;
    admin_name: string | null;
    created_at: Date;
  }>> {
    if (entityIds.length === 0) return [];

    const rows = await AppDataSource.query(
      `SELECT DISTINCT ON (a.entity_id)
         a.entity_id,
         a.action,
         u.email AS admin_email,
         u.full_name AS admin_name,
         a.created_at
       FROM admin_action_logs a
       LEFT JOIN users u ON u.id = a.admin_id
       WHERE a.entity_type = $1
         AND a.entity_id = ANY($2::uuid[])
       ORDER BY a.entity_id, a.created_at DESC`,
      [entityType, entityIds],
    );

    return rows.map((r: {
      entity_id: string;
      action: string;
      admin_email: string | null;
      admin_name: string | null;
      created_at: Date;
    }) => ({
      entity_id: r.entity_id,
      action: r.action,
      admin_email: r.admin_email,
      admin_name: r.admin_name,
      created_at: r.created_at,
    }));
  }
}
