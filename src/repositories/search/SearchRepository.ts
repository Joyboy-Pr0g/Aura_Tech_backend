import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { SearchQuery } from '../../models/SearchQuery';
import { ISearchRepository } from '../../interfaces/repositories/ISearchRepository';

@injectable()
export class SearchRepository implements ISearchRepository {
  private repo = AppDataSource.getRepository(SearchQuery);

  async saveQuery(customerId: string | null, query: string, resultsCount: number | null): Promise<void> {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    await this.repo.save(
      this.repo.create({
        customer_id: customerId,
        query: trimmed,
        results_count: resultsCount,
      }),
    );
  }

  async getRecentByCustomer(customerId: string, limit = 8): Promise<string[]> {
    const rows = await this.repo
      .createQueryBuilder('sq')
      .select('sq.query', 'query')
      .addSelect('MAX(sq.created_at)', 'last_at')
      .where('sq.customer_id = :customerId', { customerId })
      .groupBy('sq.query')
      .orderBy('last_at', 'DESC')
      .limit(limit)
      .getRawMany<{ query: string }>();
    return rows.map((r) => r.query);
  }
}
