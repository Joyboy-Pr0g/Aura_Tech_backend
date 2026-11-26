import { injectable } from 'tsyringe';
import { AppDataSource } from '../../config/database';
import { ProductReview } from '../../models/ProductReview';
import { ProductRating } from '../../models/ProductRating';
import { ProductQuestion } from '../../models/ProductQuestion';
import { QuestionAnswer } from '../../models/QuestionAnswer';
import {
  IEngagementRepository,
  ProductDetailEngagement,
  AdminQuestionFilters,
} from '../../interfaces/repositories/IEngagementRepository';
import {
  applyCreatedAtIdCursorDesc,
  CursorListResult,
  paginateByCursor,
  DEFAULT_LIMIT,
} from '../../utils/cursorPagination';
import { AppError } from '../../core/errors/AppError';
import { joinPublicUser } from '../../utils/publicUser';

@injectable()
export class EngagementRepository implements IEngagementRepository {
  private get reviewRepo() {
    return AppDataSource.getRepository(ProductReview);
  }

  private get ratingRepo() {
    return AppDataSource.getRepository(ProductRating);
  }

  private get questionRepo() {
    return AppDataSource.getRepository(ProductQuestion);
  }

  private get answerRepo() {
    return AppDataSource.getRepository(QuestionAnswer);
  }

  async findProductDetailEngagement(productId: string): Promise<ProductDetailEngagement> {
    const reviewsQuery = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.rating', 'rating')
      .where('r.product_id = :productId', { productId })
      .andWhere('r.moderation_status = :status', { status: 'approved' })
      .orderBy('r.created_at', 'DESC')
      .addOrderBy('r.id', 'DESC');

    const questionsQuery = this.questionRepo
      .createQueryBuilder('q')
      .where('q.product_id = :productId', { productId })
      .andWhere('q.is_published = true')
      .orderBy('q.created_at', 'DESC')
      .addOrderBy('q.id', 'DESC');

    const [reviews, avgResult, questions] = await Promise.all([
      joinPublicUser(reviewsQuery, 'r.customer', 'customer').getMany(),
      this.ratingRepo
        .createQueryBuilder('rt')
        .select('AVG(rt.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('rt.product_id = :productId', { productId })
        .getRawOne<{ avg: string; count: string }>(),
      joinPublicUser(questionsQuery, 'q.customer', 'customer').getMany(),
    ]);

    const questionsWithAnswers = await this.attachAnswers(questions, false);

    return {
      reviews,
      questions: questionsWithAnswers,
      average_rating: avgResult?.avg ? parseFloat(avgResult.avg) : 0,
      rating_count: avgResult?.count ? parseInt(avgResult.count, 10) : 0,
    };
  }

  async findReviewsByCustomerId(customerId: string): Promise<ProductReview[]> {
    return this.reviewRepo.find({
      where: { customer_id: customerId },
      relations: ['product', 'rating'],
      order: { created_at: 'DESC', id: 'DESC' },
    });
  }

  async findQuestionsByCustomerId(customerId: string): Promise<ProductQuestion[]> {
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.product', 'product')
      .where('q.customer_id = :customerId', { customerId })
      .orderBy('q.created_at', 'DESC')
      .addOrderBy('q.id', 'DESC');
    const questions = await joinPublicUser(qb, 'q.customer', 'customer').getMany();
    return this.attachAnswers(questions, true);
  }

  async findQuestionsForAdmin(filters: AdminQuestionFilters): Promise<CursorListResult<ProductQuestion>> {
    const { search, limit = DEFAULT_LIMIT, cursor } = filters;
    const qb = joinPublicUser(this.questionRepo.createQueryBuilder('q'), 'q.customer', 'customer')
      .leftJoinAndSelect('q.product', 'product');

    if (search?.trim()) {
      qb.andWhere(
        `(LOWER(q.question) LIKE LOWER(:search) OR LOWER(product.title) LIKE LOWER(:search))`,
        { search: `%${search.trim()}%` },
      );
    }

    applyCreatedAtIdCursorDesc(qb, 'q', cursor ?? null);
    qb.orderBy('q.created_at', 'DESC').addOrderBy('q.id', 'DESC').take(limit + 1);

    const rows = await qb.getMany();
    const page = paginateByCursor(rows, limit);
    const items = await this.attachAnswers(page.items, true);

    return {
      items,
      next_cursor: page.next_cursor,
      has_more: page.has_more,
    };
  }

  async findQuestionById(id: string): Promise<ProductQuestion | null> {
    return this.questionRepo.findOne({
      where: { id },
      relations: ['product'],
    });
  }

  async createQuestionAnswer(
    questionId: string,
    adminId: string,
    answer: string,
  ): Promise<QuestionAnswer> {
    const question = await this.questionRepo.findOne({ where: { id: questionId } });
    if (!question) throw new AppError(404, 'Question not found');

    return this.answerRepo.save(
      this.answerRepo.create({
        question_id: questionId,
        answered_by_id: adminId,
        answer,
        is_seller_answer: true,
        moderation_status: 'approved',
        is_published: true,
      }),
    );
  }

  private async attachAnswers(
    questions: ProductQuestion[],
    forAdmin: boolean,
  ): Promise<ProductQuestion[]> {
    if (questions.length === 0) return [];

    const questionIds = questions.map((question) => question.id);
    const answersQuery = this.answerRepo
      .createQueryBuilder('a')
      .where('a.question_id IN (:...questionIds)', { questionIds })
      .orderBy('a.created_at', 'ASC');

    if (!forAdmin) {
      answersQuery
        .andWhere('a.is_published = true')
        .andWhere('a.moderation_status = :status', { status: 'approved' });
    }

    const answers = await joinPublicUser(answersQuery, 'a.answered_by', 'answered_by').getMany();

    const answersByQuestionId = new Map<string, QuestionAnswer[]>();
    for (const answer of answers) {
      const existing = answersByQuestionId.get(answer.question_id) ?? [];
      existing.push(answer);
      answersByQuestionId.set(answer.question_id, existing);
    }

    return questions.map((question) => {
      question.answers = answersByQuestionId.get(question.id) ?? [];
      return question;
    });
  }
}
