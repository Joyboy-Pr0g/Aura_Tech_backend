import { ProductReview } from '../../models/ProductReview';
import { ProductQuestion } from '../../models/ProductQuestion';
import { QuestionAnswer } from '../../models/QuestionAnswer';
import { CursorListResult, DecodedCursor } from '../../utils/cursorPagination';

export interface ProductDetailEngagement {
  reviews: ProductReview[];
  questions: ProductQuestion[];
  average_rating: number;
  rating_count: number;
}

export interface AdminQuestionFilters {
  search?: string;
  limit?: number;
  cursor?: DecodedCursor | null;
}

export interface IEngagementRepository {
  findProductDetailEngagement(productId: string): Promise<ProductDetailEngagement>;
  findReviewsByCustomerId(customerId: string): Promise<ProductReview[]>;
  findQuestionsByCustomerId(customerId: string): Promise<ProductQuestion[]>;
  findQuestionsForAdmin(filters: AdminQuestionFilters): Promise<CursorListResult<ProductQuestion>>;
  findQuestionById(id: string): Promise<ProductQuestion | null>;
  createQuestionAnswer(
    questionId: string,
    adminId: string,
    answer: string,
  ): Promise<QuestionAnswer>;
}
