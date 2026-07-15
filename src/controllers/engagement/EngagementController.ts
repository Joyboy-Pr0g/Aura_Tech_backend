import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { EngagementService } from '../../services/engagement/EngagementService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { OrderService } from '../../services/order/OrderService';

@injectable()
export class EngagementController {
  constructor(
    @inject(EngagementService) private engagementService: EngagementService,
    @inject(OrderService) private orderService: OrderService,
  ) {}

  getWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.engagementService.getWishlist(req.user!.id);
      res.json(APIResponse.success('Wishlist fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  addToWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.engagementService.addToWishlist(req.user!.id, req.body.product_id);
      res.status(201).json(APIResponse.success('Added to wishlist', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.engagementService.removeFromWishlist(req.user!.id, req.params.productId);
      res.json(APIResponse.success('Removed from wishlist'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getProductReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query.limit) || 5, 20);
      const cursor = req.query.cursor as string | undefined;
      const data = await this.engagementService.getProductReviews(
        req.params.productId,
        limit,
        cursor,
      );
      res.json(
        APIResponse.success(
          'Reviews fetched',
          {
            items: data.items,
            average_rating: data.average_rating,
            rating_count: data.rating_count,
          },
          { next_cursor: data.next_cursor, has_more: data.has_more },
        ),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getMyReviews = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.engagementService.getMyReviews(req.user!.id);
      res.json(APIResponse.success('Reviews fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  createReview = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.engagementService.createReview(req.user!.id, req.validatedData);
      res.status(201).json(APIResponse.success('Review submitted', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getProductQuestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const limit = Math.min(Number(req.query.limit) || 10, 50);
      const cursor = req.query.cursor as string | undefined;
      const data = await this.engagementService.getProductQuestions(
        req.params.productId,
        limit,
        cursor,
      );
      res.json(
        APIResponse.success('Questions fetched', data.items, {
          next_cursor: data.next_cursor,
          has_more: data.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  askQuestion = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.engagementService.askQuestion(
        req.user!.id,
        req.params.productId,
        req.validatedData.question,
      );
      res.status(201).json(APIResponse.success('Question submitted', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getOrderHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.orderService.getOrderById(req.params.id, req.user!.id);
      const data = await this.engagementService.getOrderStatusHistory(req.params.id);
      res.json(APIResponse.success('Order history fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
