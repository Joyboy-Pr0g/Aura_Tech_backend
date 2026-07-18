import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { Wishlist } from '../../models/Wishlist';
import { ProductReview } from '../../models/ProductReview';
import { ProductRating } from '../../models/ProductRating';
import { ProductQuestion } from '../../models/ProductQuestion';
import { QuestionAnswer } from '../../models/QuestionAnswer';
import { Product } from '../../models/Product';
import { OrderStatusHistory } from '../../models/OrderStatusHistory';
import { OrderItem } from '../../models/OrderItem';
import { AppError } from '../../core/errors/AppError';
import {
  applyCreatedAtIdCursorDesc,
  decodeCreatedAtIdCursor,
  paginateByCursor,
} from '../../utils/cursorPagination';
import { Order } from '../../models/Order';
import { moderateCombinedText } from '../moderation/ArabicModerationService';

@injectable()
export class EngagementService {
  private wishlistRepo = () => AppDataSource.getRepository(Wishlist);
  private reviewRepo = () => AppDataSource.getRepository(ProductReview);
  private ratingRepo = () => AppDataSource.getRepository(ProductRating);
  private questionRepo = () => AppDataSource.getRepository(ProductQuestion);
  private answerRepo = () => AppDataSource.getRepository(QuestionAnswer);
  private productRepo = () => AppDataSource.getRepository(Product);
  private orderItemRepo = () => AppDataSource.getRepository(OrderItem);
  private historyRepo = () => AppDataSource.getRepository(OrderStatusHistory);
  private orderRepo = () => AppDataSource.getRepository(Order);

  async getWishlist(customerId: string) {
    const items = await this.wishlistRepo().find({
      where: { customer_id: customerId },
      relations: ['product', 'product.category'],
      order: { created_at: 'DESC' },
    });
    return items.map((w) => w.product);
  }

  async addToWishlist(customerId: string, productId: string) {
    const product = await this.productRepo().findOne({ where: { id: productId } });
    if (!product) throw new AppError(404, 'Product not found');

    const exists = await this.wishlistRepo().findOne({
      where: { customer_id: customerId, product_id: productId },
    });
    if (exists) return { added: false };

    await this.wishlistRepo().save(
      this.wishlistRepo().create({ customer_id: customerId, product_id: productId }),
    );
    return { added: true };
  }

  async removeFromWishlist(customerId: string, productId: string) {
    await this.wishlistRepo().delete({ customer_id: customerId, product_id: productId });
  }

  async isInWishlist(customerId: string, productId: string): Promise<boolean> {
    return this.wishlistRepo().existsBy({ customer_id: customerId, product_id: productId });
  }

  async getProductReviews(productId: string, limit = 5, cursorRaw?: string) {
    const decoded = decodeCreatedAtIdCursor(cursorRaw);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    const qb = this.reviewRepo()
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.customer', 'customer')
      .leftJoinAndSelect('r.rating', 'rating')
      .where('r.product_id = :productId', { productId })
      .andWhere('r.moderation_status = :status', { status: 'approved' });

    applyCreatedAtIdCursorDesc(qb, 'r', decoded);
    qb.orderBy('r.created_at', 'DESC').addOrderBy('r.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const page = paginateByCursor(rows, limit);

    const avgResult = await this.ratingRepo()
      .createQueryBuilder('rt')
      .select('AVG(rt.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('rt.product_id = :productId', { productId })
      .getRawOne<{ avg: string; count: string }>();

    return {
      ...page,
      average_rating: avgResult?.avg ? parseFloat(avgResult.avg) : 0,
      rating_count: avgResult?.count ? parseInt(avgResult.count, 10) : 0,
    };
  }

  async getMyReviews(customerId: string) {
    return this.reviewRepo().find({
      where: { customer_id: customerId },
      relations: ['product', 'rating'],
      order: { created_at: 'DESC' },
    });
  }

  async createReview(
    customerId: string,
    data: { product_id: string; rating: number; title: string; content: string; order_item_id: string },
  ) {
    const product = await this.productRepo().findOne({ where: { id: data.product_id } });
    if (!product) throw new AppError(404, 'Product not found');

    const orderItem = await this.orderItemRepo().findOne({
      where: { id: data.order_item_id, product_id: data.product_id },
      relations: ['order'],
    });
    if (!orderItem || orderItem.order?.customer_id !== customerId) {
      throw new AppError(403, 'You can only review products from your orders');
    }

    const existing = await this.reviewRepo().findOne({
      where: { customer_id: customerId, product_id: data.product_id },
    });
    if (existing) throw new AppError(409, 'You already reviewed this product');

    const moderation = moderateCombinedText(data.title, data.content);

    const rating = await this.ratingRepo().save(
      this.ratingRepo().create({
        product_id: data.product_id,
        customer_id: customerId,
        order_item_id: data.order_item_id,
        rating: data.rating,
      }),
    );

    const review = await this.reviewRepo().save(
      this.reviewRepo().create({
        product_id: data.product_id,
        customer_id: customerId,
        order_item_id: data.order_item_id,
        rating_id: rating.id,
        title: data.title,
        content: data.content,
        moderation_status: moderation.requiresReview ? 'pending' : 'approved',
        moderation_notes: moderation.requiresReview ? 'Flagged by profanity filter' : null,
        is_verified_purchase: true,
      }),
    );

    return review;
  }

  async getProductQuestions(productId: string, limit = 10, cursorRaw?: string) {
    const decoded = decodeCreatedAtIdCursor(cursorRaw);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }

    const qb = this.questionRepo()
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.customer', 'customer')
      .where('q.product_id = :productId', { productId })
      .andWhere('q.is_published = true');

    applyCreatedAtIdCursorDesc(qb, 'q', decoded);
    qb.orderBy('q.created_at', 'DESC').addOrderBy('q.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const page = paginateByCursor(rows, limit);

    const withAnswers = await Promise.all(
      page.items.map(async (q) => {
        const answers = await this.answerRepo().find({
          where: { question_id: q.id, is_published: true, moderation_status: 'approved' },
          relations: ['answered_by'],
          order: { created_at: 'ASC' },
        });
        return { ...q, answers };
      }),
    );

    return {
      items: withAnswers,
      next_cursor: page.next_cursor,
      has_more: page.has_more,
    };
  }

  async askQuestion(customerId: string, productId: string, question: string) {
    const product = await this.productRepo().findOne({ where: { id: productId } });
    if (!product) throw new AppError(404, 'Product not found');

    const moderation = moderateCombinedText(question);

    return this.questionRepo().save(
      this.questionRepo().create({
        product_id: productId,
        customer_id: customerId,
        question,
        is_published: !moderation.requiresReview,
      }),
    );
  }

  async getOrderStatusHistory(orderNumber: string) {
    const order = await this.orderRepo().findOne({ where: { order_number: orderNumber } });
    if (!order) throw new AppError(404, 'Order not found');
    return this.historyRepo().find({
      where: { order_id: order.id },
      order: { created_at: 'ASC' },
    });
  }
}
