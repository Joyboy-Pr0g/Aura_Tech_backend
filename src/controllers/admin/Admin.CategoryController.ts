import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminCategoryService } from '../../services/admin/AdminCategoryService';

@injectable()
export class AdminCategoryController {
  constructor(
    @inject(AdminCategoryService) private adminCategoryService: AdminCategoryService,
  ) { }

  createCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { name, description, parent_category_id, is_active } = req.validatedData;
      const imageFile = req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
        : undefined;
      const category = await this.adminCategoryService.createCategory({
        name,
        description,
        parent_category_id,
        is_active,
        imageFile,
      }, req.user!.id);
      res.status(201).json(APIResponse.success('Category created successfully', category));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const imageFile = req.file
        ? { buffer: req.file.buffer, mimetype: req.file.mimetype }
        : undefined;
      const category = await this.adminCategoryService.updateCategory(id, {
        ...req.validatedData,
        imageFile,
      }, req.user!.id);
      res.json(APIResponse.success('Category updated successfully', category));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getCategories = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { search, is_active, parent_category_id, cursor, limit, include_deleted } = req.validatedData;
      const page = await this.adminCategoryService.getCategories({
        search,
        is_active,
        parent_category_id,
        cursor,
        limit,
        include_deleted,
      });
      res.json(
        APIResponse.success('Categories fetched successfully', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getCategoryById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const category = await this.adminCategoryService.getCategoryById(req.params.id);
      res.json(APIResponse.success('Category fetched successfully', category));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  activateCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.activateCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Category activated successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deactivateCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.deactivateCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Category deactivated successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deleteCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.deleteCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Category deleted successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  softDeleteCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.softDeleteCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Category soft deleted successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  restoreCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.restoreCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Category restored successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  unassignParentCategory = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminCategoryService.unassignParentCategory(req.params.id, req.user!.id);
      res.json(APIResponse.success('Parent category unassigned successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
