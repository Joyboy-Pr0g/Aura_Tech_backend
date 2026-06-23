import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { ProductService } from '../../services/product/ProductService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class ProductController {
  constructor(@inject(ProductService) private productService: ProductService) {}

  async getMany(req: Request, res: Response): Promise<void> {
    try {
      const { category_id, brand, min_price, max_price, in_stock, search, limit } = req.query;
      const result = await this.productService.getMany({
        category_id: category_id as string,
        brand: brand as string,
        min_price: min_price ? Number(min_price) : undefined,
        max_price: max_price ? Number(max_price) : undefined,
        in_stock: in_stock === 'true',
        search: search as string,
        limit: limit ? Number(limit) : 20,
      });
      res.json(APIResponse.success('Products fetched', result));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.productService.getById(req.params.id);
      res.json(APIResponse.success('Product fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async getBySlug(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.productService.getBySlug(req.params.slug);
      res.json(APIResponse.success('Product fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, price, category_id, brand, features, variants } = req.validatedData;
      const imageFiles = (req.files as Express.Multer.File[] | undefined)?.map((f, i) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
        is_primary: i === 0,
      }));

      const data = await this.productService.create({
        title, description, price, category_id, brand, features,
        imageFiles,
        variants,
        created_by_id: req.user!.id,
      });
      res.status(201).json(APIResponse.success('Product created', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const { deleteImagePublicIds, ...rest } = req.validatedData;
      const newImageFiles = (req.files as Express.Multer.File[] | undefined)?.map((f) => ({
        buffer: f.buffer,
        mimetype: f.mimetype,
      }));
      const data = await this.productService.update(
        req.params.id,
        { ...rest, deleteImagePublicIds, newImageFiles },
        req.user!.id,
      );
      res.json(APIResponse.success('Product updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async addStock(req: Request, res: Response): Promise<void> {
    try {
      const { quantity, variant_id, notes } = req.validatedData;
      const data = await this.productService.addStock(req.params.id, quantity, req.user!.id, variant_id, notes);
      res.json(APIResponse.success('Stock updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      await this.productService.delete(req.params.id);
      res.json(APIResponse.success('Product deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  }
}
