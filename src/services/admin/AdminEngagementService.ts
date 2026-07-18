import { injectable, inject } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../di/repository.tokens';
import { IEngagementRepository } from '../../interfaces/repositories/IEngagementRepository';
import { NotificationService } from '../notification/NotificationService';
import { AppError } from '../../core/errors/AppError';
import { decodeCreatedAtIdCursor } from '../../utils/cursorPagination';

@injectable()
export class AdminEngagementService {
  constructor(
    @inject(REPOSITORY_TOKENS.IEngagementRepository)
    private engagementRepo: IEngagementRepository,
    @inject(NotificationService) private notificationService: NotificationService,
  ) {}

  async getQuestions(filters: { search?: string; limit: number; cursor?: string }) {
    const decoded = decodeCreatedAtIdCursor(filters.cursor);
    if (decoded === 'invalid') {
      throw new AppError(400, 'Invalid or malformed cursor');
    }
    return this.engagementRepo.findQuestionsForAdmin({
      search: filters.search,
      limit: filters.limit,
      cursor: decoded,
    });
  }

  async answerQuestion(questionId: string, adminId: string, answer: string) {
    const question = await this.engagementRepo.findQuestionById(questionId);
    if (!question) throw new AppError(404, 'Question not found');

    const saved = await this.engagementRepo.createQuestionAnswer(questionId, adminId, answer);

    const productTitle = question.product?.title ?? 'المنتج';
    void this.notificationService.notifyCustomer({
      customerId: question.customer_id,
      type: 'question_answered',
      title: 'تم الرد على سؤالك',
      message: `أجاب فريق AURA TECH على سؤالك بخصوص «${productTitle}».`,
      relatedProductId: question.product_id,
      skipEmail: true,
    });

    return saved;
  }
}
