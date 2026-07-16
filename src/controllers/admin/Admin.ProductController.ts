import { injectable, inject } from 'tsyringe';
import { Request, Response, NextFunction } from 'express';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';
import { AdminProductService } from '../../services/admin/AdminProductService';
import { parseProductUploadFiles } from '../../utils/productUploadFiles';

@injectable()
export class AdminProductController {
  constructor(
    @inject(AdminProductService) private adminProductService: AdminProductService,
  ) { }

  createProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { title, description, price, category_id, sub_category_id, brand, features, variants, stock_quantity } = req.validatedData;
      const { imageFiles, variantImageFiles } = parseProductUploadFiles(req.files as Express.Multer.File[] | undefined);

      const product = await this.adminProductService.createProduct({
        title,
        description,
        price,
        category_id,
        sub_category_id,
        brand,
        features,
        imageFiles,
        variantImageFiles,
        variants,
        stock_quantity,
        created_by_id: req.user!.id,
      });
      res.status(201).json(APIResponse.success('Product created successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  updateProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { deleteImagePublicIds, ...rest } = req.validatedData;
      const { imageFiles, variantImageFiles } = parseProductUploadFiles(req.files as Express.Multer.File[] | undefined);
      const newImageFiles = imageFiles.map(({ buffer, mimetype }) => ({ buffer, mimetype }));

      const product = await this.adminProductService.updateProduct(
        id,
        { ...rest, deleteImagePublicIds, newImageFiles, variantImageFiles },
        req.user!.id,
      );
      res.json(APIResponse.success('Product updated successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getProducts = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const {
        category_id,
        brand,
        min_price,
        max_price,
        in_stock,
        search,
        cursor,
        limit,
        include_deleted,
      } = req.validatedData;

      const page = await this.adminProductService.getProducts({
        category_id,
        brand,
        min_price,
        max_price,
        in_stock,
        search,
        cursor,
        limit,
        include_deleted,
      });

      res.json(
        APIResponse.success('Products fetched successfully', page.items, {
          next_cursor: page.next_cursor,
          has_more: page.has_more,
        }),
      );
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  getProductById = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const product = await this.adminProductService.getProductById(req.params.id);
      res.json(APIResponse.success('Product fetched successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  addStock = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { quantity, variant_id, notes } = req.validatedData;
      const product = await this.adminProductService.addStock(
        req.params.id,
        quantity,
        req.user!.id,
        variant_id,
        notes,
      );
      res.json(APIResponse.success('Stock updated successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  deleteProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminProductService.deleteProduct(req.params.id);
      res.json(APIResponse.success('Product deleted successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  softDeleteProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminProductService.softDeleteProduct(req.params.id);
      res.json(APIResponse.success('Product soft deleted successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  restoreProduct = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      await this.adminProductService.restoreProduct(req.params.id);
      res.json(APIResponse.success('Product restored successfully'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  setPrimaryImage = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { image_id } = req.validatedData;
      const product = await this.adminProductService.setPrimaryImage(req.params.id, image_id, req.user!.id);
      res.json(APIResponse.success('Primary image set successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };

  removeImage = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    try {
      const { image_id } = req.validatedData;
      const product = await this.adminProductService.removeImage(req.params.id, image_id, req.user!.id);
      res.json(APIResponse.success('Image removed successfully', product));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error((err as Error).message));
    }
  };
}
