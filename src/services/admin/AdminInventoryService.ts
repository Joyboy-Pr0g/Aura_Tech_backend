import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IInventoryRepository } from '../../interfaces/repositories/IInventoryRepository';

@injectable()
export class AdminInventoryService {
  constructor(
    @inject(REPOSITORY_TOKENS.IInventoryRepository) private inventoryRepo: IInventoryRepository,
  ) {}

  getLogs(filters: Parameters<IInventoryRepository['findLogs']>[0]) {
    return this.inventoryRepo.findLogs(filters);
  }

  getEntityActions(entityType: string, entityId: string, limit?: number) {
    return this.inventoryRepo.findActionLogsForEntity(entityType, entityId, limit);
  }

  getLatestActions(entityType: string, entityIds: string[]) {
    return this.inventoryRepo.findLatestActionsForEntities(entityType, entityIds);
  }
}
