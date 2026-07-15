import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { CategoryService } from '../../services/category/CategoryService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class CategoryController {
  constructor(@inject(CategoryService) private categoryService: CategoryService) {}

  async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const data = await this.categoryService.getAll();
      res.json(APIResponse.success('Categories fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.categoryService.getById(req.params.id);
      res.json(APIResponse.success('Category fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.categoryService.getBySlug(req.params.slug);
      res.json(APIResponse.success('Category fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }
}
