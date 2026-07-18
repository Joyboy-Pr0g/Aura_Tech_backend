import { injectable } from 'tsyringe';
import { In } from 'typeorm';
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
    const [reviews, avgResult, questions] = await Promise.all([
      this.reviewRepo.find({
        where: { product_id: productId, moderation_status: 'approved' },
        relations: ['customer', 'rating'],
        order: { created_at: 'DESC', id: 'DESC' },
      }),
      this.ratingRepo
        .createQueryBuilder('rt')
        .select('AVG(rt.rating)', 'avg')
        .addSelect('COUNT(*)', 'count')
        .where('rt.product_id = :productId', { productId })
        .getRawOne<{ avg: string; count: string }>(),
      this.questionRepo.find({
        where: { product_id: productId, is_published: true },
        relations: ['customer'],
        order: { created_at: 'DESC', id: 'DESC' },
      }),
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
    const questions = await this.questionRepo.find({
      where: { customer_id: customerId },
      relations: ['product', 'customer'],
      order: { created_at: 'DESC', id: 'DESC' },
    });
    return this.attachAnswers(questions, true);
  }

  async findQuestionsForAdmin(filters: AdminQuestionFilters): Promise<CursorListResult<ProductQuestion>> {
    const { search, limit = DEFAULT_LIMIT, cursor } = filters;
    const qb = this.questionRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.customer', 'customer')
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
    const answers = await this.answerRepo.find({
      where: forAdmin
        ? { question_id: In(questionIds) }
        : {
            question_id: In(questionIds),
            is_published: true,
            moderation_status: 'approved',
          },
      relations: ['answered_by'],
      order: { created_at: 'ASC' },
    });

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
