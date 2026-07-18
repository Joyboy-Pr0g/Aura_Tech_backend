import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { ITrendingRepository } from '../../interfaces/repositories/ITrendingRepository';
import { Product } from '../../models/Product';

@injectable()
export class TrendingService {
  constructor(
    @inject(REPOSITORY_TOKENS.ITrendingRepository) private trendingRepo: ITrendingRepository,
  ) {}

  async logProductView(productId: string, customerId: string | null): Promise<void> {
    await this.trendingRepo.logProductView(productId, customerId);
  }

  async calculateTrending(): Promise<void> {
    await this.trendingRepo.calculateAndStoreTrending();
  }

  async getTrendingProducts(limit = 20): Promise<Product[]> {
    return this.trendingRepo.getTopTrending(limit);
  }
}
