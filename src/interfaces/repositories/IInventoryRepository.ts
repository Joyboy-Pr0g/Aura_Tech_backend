import { InventoryLog, InventoryReason } from '../../models/InventoryLog';

export interface InventoryLogFilters {
  productId?: string;
  reason?: InventoryReason;
  changedById?: string;
  limit?: number;
  cursor?: { createdAt: Date; id: string } | null;
}

export interface IInventoryRepository {
  logChange(data: {
    productId: string;
    variantId?: string | null;
    quantityChange: number;
    reason: InventoryReason;
    referenceId?: string | null;
    changedById?: string | null;
    notes?: string | null;
  }): Promise<InventoryLog>;
  findLogs(filters: InventoryLogFilters): Promise<InventoryLog[]>;
  findActionLogsForEntity(entityType: string, entityId: string, limit?: number): Promise<Array<Record<string, unknown>>>;
  findLatestActionsForEntities(
    entityType: string,
    entityIds: string[],
  ): Promise<Array<{
    entity_id: string;
    action: string;
    admin_email: string | null;
    admin_name: string | null;
    created_at: Date;
  }>>;
}
