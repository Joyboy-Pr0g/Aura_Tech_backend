import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ProductService } from '../../services/product/ProductService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { DEFAULT_LIMIT } from '../../utils/cursorPagination';

@injectable()
export class ProductController {
  constructor(@inject(ProductService) private productService: ProductService) { }

  async getMany(req: Request, res: Response): Promise<void> {
    try {
      const {
        category_id,
        sub_category_id,
        brand,
        min_price,
        max_price,
        in_stock,
        search,
        limit,
        cursor,
      } = req.validatedData;
      const userId = req.user?.id;
      const page = await this.productService.getMany({
        category_id,
        sub_category_id,
        brand,
        min_price,
        max_price,
        in_stock,
        search,
        limit: limit ?? DEFAULT_LIMIT,
        cursor,
        userId,
      });
      res.json(
        APIResponse.success('Products fetched', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const data = await this.productService.getBySlug(req.params.slug, userId);
      res.json(APIResponse.success('Product fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  brands = async (_req: Request, res: Response): Promise<void> => {
    try {
      const brands = await this.productService.getBrands();
      res.json(APIResponse.success('Brands fetched', brands));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  maxProductPrice = async (_req: Request, res: Response): Promise<void> => {
    try {
      const maxPrice = await this.productService.getMaxProductPrice();
      res.json(APIResponse.success('Max product price fetched', maxPrice));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

}
