import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { AdminInventoryService } from '../../services/admin/AdminInventoryService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminActionLogController {
  constructor(@inject(AdminInventoryService) private inventoryService: AdminInventoryService) {}

  latest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { entity_type, ids } = req.validatedData;
      const entityIds = String(ids)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const data = await this.inventoryService.getLatestActions(entity_type, entityIds);
      res.json(APIResponse.success('Latest actions fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
