import { Router } from 'express';
import { container } from '../di/container';
import { EngagementController } from '../controllers/engagement/EngagementController';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validateRequest } from '../middleware/validation';
import { Role } from '../types/rbac';
import {
  createReviewSchema,
  askQuestionSchema,
  wishlistSchema,
} from '../validators/engagement.validator';

const router = Router();
const ctrl = container.resolve(EngagementController);
const customerOnly = [protect, authorize([Role.CUSTOMER])] as const;

// Public product engagement
router.get('/products/:productId/reviews', (req, res) => ctrl.getProductReviews(req, res));
router.get('/products/:productId/questions', (req, res) => ctrl.getProductQuestions(req, res));

// Customer authenticated — applied per-route (do not use pathless router.use(protect) on a `/` mount)
router.get('/wishlists', ...customerOnly, ctrl.getWishlist);
router.post('/wishlists', ...customerOnly, validateRequest(wishlistSchema), ctrl.addToWishlist);
router.delete('/wishlists/:productId', ...customerOnly, ctrl.removeFromWishlist);

router.get('/reviews/my', ...customerOnly, ctrl.getMyReviews);
router.post('/reviews', ...customerOnly, validateRequest(createReviewSchema), ctrl.createReview);

router.post(
  '/products/:productId/questions',
  ...customerOnly,
  validateRequest(askQuestionSchema),
  ctrl.askQuestion,
);

router.get('/orders/my/:id/history', ...customerOnly, ctrl.getOrderHistory);

export default router;
