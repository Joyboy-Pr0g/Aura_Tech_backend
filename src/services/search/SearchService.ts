import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ISearchRepository } from '../../interfaces/repositories/ISearchRepository';

@injectable()
export class SearchService {
  constructor(
    @inject(REPOSITORY_TOKENS.ISearchRepository) private searchRepo: ISearchRepository,
  ) {}

  async logSearch(customerId: string | null, query: string, resultsCount: number | null): Promise<void> {
    await this.searchRepo.saveQuery(customerId, query, resultsCount);
  }

  async getRecentSearches(customerId: string): Promise<string[]> {
    return this.searchRepo.getRecentByCustomer(customerId);
  }
}
