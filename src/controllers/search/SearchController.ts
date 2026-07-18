import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { SearchService } from '../../services/search/SearchService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class SearchController {
  constructor(@inject(SearchService) private searchService: SearchService) {}

  getRecent = async (req: Request, res: Response): Promise<void> => {
    try {
      const customerId = req.user!.id;
      const data = await this.searchService.getRecentSearches(customerId);
      res.json(APIResponse.success('Recent searches', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
