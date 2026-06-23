import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { CategoryService } from '../../services/category/CategoryService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class CategoryController {
  constructor(@inject(CategoryService) private categoryService: CategoryService) {}

  async getAll(req: Request, res: Response): Promise<void> {
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

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, parent_category_id } = req.validatedData;
      const imageFile = req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
        : undefined;
      const data = await this.categoryService.create({ name, description, parent_category_id, imageFile });
      res.status(201).json(APIResponse.success('Category created', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const imageFile = req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
        : undefined;
      const data = await this.categoryService.update(req.params.id, { ...req.validatedData, imageFile });
      res.json(APIResponse.success('Category updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.categoryService.delete(req.params.id);
      res.json(APIResponse.success('Category deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }
}
