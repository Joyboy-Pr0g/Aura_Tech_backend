import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { BlogService } from '../../services/blog/BlogService';
import { logAdminAction } from '../../utils/logAdminAction';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class AdminBlogController {
  constructor(@inject(BlogService) private blogService: BlogService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.blogService.listAll();
      res.json(APIResponse.success('Blogs fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.blogService.getById(req.params.id);
      res.json(APIResponse.success('Blog fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const coverFile = (req.file as Express.Multer.File | undefined);
      const data = await this.blogService.create({
        ...req.validatedData,
        author_id: req.user!.id,
        coverFile: coverFile ? { buffer: coverFile.buffer, mimetype: coverFile.mimetype } : undefined,
      });
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'create',
        entity_type: 'blog',
        entity_id: data.id,
        changes_json: { title: data.title, slug: data.slug },
      });
      res.status(201).json(APIResponse.success('Blog created', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const coverFile = (req.file as Express.Multer.File | undefined);
      const data = await this.blogService.update(req.params.id, {
        ...req.validatedData,
        coverFile: coverFile ? { buffer: coverFile.buffer, mimetype: coverFile.mimetype } : undefined,
      });
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'update',
        entity_type: 'blog',
        entity_id: req.params.id,
        changes_json: req.validatedData,
      });
      res.json(APIResponse.success('Blog updated', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.blogService.delete(req.params.id);
      void logAdminAction({
        admin_id: req.user!.id,
        action: 'delete',
        entity_type: 'blog',
        entity_id: req.params.id,
      });
      res.json(APIResponse.success('Blog deleted'));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
