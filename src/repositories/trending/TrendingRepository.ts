import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { ProductView } from '../../models/ProductView';
import { TrendingProduct } from '../../models/TrendingProduct';
import { Product } from '../../models/Product';
import { ITrendingRepository } from '../../interfaces/repositories/ITrendingRepository';

@injectable()
export class TrendingRepository implements ITrendingRepository {
  private viewRepo = AppDataSource.getRepository(ProductView);
  private trendingRepo = AppDataSource.getRepository(TrendingProduct);
  private productRepo = AppDataSource.getRepository(Product);

  async logProductView(productId: string, customerId: string | null): Promise<void> {
    await this.viewRepo.save(
      this.viewRepo.create({
        product_id: productId,
        customer_id: customerId,
        viewed_at: new Date(),
      }),
    );
  }

  async calculateAndStoreTrending(): Promise<void> {
    const since = new Date();
    since.setDate(since.getDate() - 7);

    const viewStats = await this.viewRepo
      .createQueryBuilder('pv')
      .select('pv.product_id', 'product_id')
      .addSelect('COUNT(*)', 'view_count')
      .where('pv.viewed_at >= :since', { since })
      .groupBy('pv.product_id')
      .getRawMany<{ product_id: string; view_count: string }>();

    const purchaseStats = await AppDataSource.query(
      `SELECT oi.product_id, COUNT(*)::int AS purchase_count
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.created_at >= $1
         AND o.status IN ('payment_confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered')
       GROUP BY oi.product_id`,
      [since],
    ) as Array<{ product_id: string; purchase_count: number }>;

    const ratingStats = await AppDataSource.query(
      `SELECT product_id, AVG(rating)::numeric(3,2) AS rating_average
       FROM product_reviews
       WHERE created_at >= $1
       GROUP BY product_id`,
      [since],
    ) as Array<{ product_id: string; rating_average: string }>;

    const viewMap = new Map(viewStats.map((v) => [v.product_id, Number(v.view_count)]));
    const purchaseMap = new Map(purchaseStats.map((p) => [p.product_id, Number(p.purchase_count)]));
    const ratingMap = new Map(ratingStats.map((r) => [r.product_id, Number(r.rating_average)]));

    const productIds = new Set<string>([
      ...viewMap.keys(),
      ...purchaseMap.keys(),
      ...ratingMap.keys(),
    ]);

    await this.trendingRepo.clear();

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 1);

    for (const productId of productIds) {
      const viewCount = viewMap.get(productId) ?? 0;
      const purchaseCount = purchaseMap.get(productId) ?? 0;
      const ratingAverage = ratingMap.get(productId) ?? 0;
      const trendScore = viewCount * 0.3 + purchaseCount * 0.5 + ratingAverage * 0.2;

      await this.trendingRepo.save(
        this.trendingRepo.create({
          product_id: productId,
          view_count: viewCount,
          purchase_count: purchaseCount,
          rating_average: ratingAverage,
          trend_score: trendScore,
          calculated_at: new Date(),
          valid_until: validUntil,
        }),
      );
    }
  }

  async getTopTrending(limit = 20): Promise<Product[]> {
    const rows = await this.trendingRepo
      .createQueryBuilder('tp')
      .innerJoinAndSelect('tp.product', 'p')
      .leftJoinAndSelect('p.category', 'cat')
      .leftJoinAndSelect('p.variants', 'variants')
      .where('p.deleted_at IS NULL')
      .orderBy('tp.trend_score', 'DESC')
      .take(limit)
      .getMany();

    return rows.map((r) => r.product);
  }
}
