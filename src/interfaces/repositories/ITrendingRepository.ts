import { Product } from '../../models/Product';

export interface ITrendingRepository {
  logProductView(productId: string, customerId: string | null): Promise<void>;
  calculateAndStoreTrending(): Promise<void>;
  getTopTrending(limit?: number): Promise<Product[]>;
}
