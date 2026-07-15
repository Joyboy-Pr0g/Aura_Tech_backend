import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { CartService } from '../../services/cart/CartService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class CartController {
  constructor(@inject(CartService) private cartService: CartService) {}

  getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cart = await this.cartService.getCart(req.user!.id);
      res.json(APIResponse.success('Cart retrieved', cart));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { product_id, variant_id, quantity } = req.validatedData;
      const item = await this.cartService.addOrUpdateItem(
        req.user!.id,
        product_id,
        variant_id ?? null,
        quantity,
      );
      res.status(201).json(APIResponse.success('Item added to cart', item));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  editQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { itemId, quantity } = req.validatedData;
      await this.cartService.editQuantity(req.user!.id, itemId, quantity);
      res.json(APIResponse.success('Quantity edited'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cartService.removeItem(req.user!.id, req.params.itemId);
      res.json(APIResponse.success('Item removed from cart'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cartService.clearCart(req.user!.id);
      res.json(APIResponse.success('Cart cleared'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
