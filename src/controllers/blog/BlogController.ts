import { injectable, inject } from 'tsyringe';
import { Request, Response } from 'express';
import { BlogService } from '../../services/blog/BlogService';
import { APIResponse } from '../../core/responses/api-response';
import { getErrorStatusCode } from '../../core/responses/controller-error-status';

@injectable()
export class BlogController {
  constructor(@inject(BlogService) private blogService: BlogService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.blogService.listPublished();
      res.json(APIResponse.success('Blogs fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };

  getBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.blogService.getPublishedBySlug(req.params.slug);
      res.json(APIResponse.success('Blog fetched', data));
    } catch (err) {
      res.status(getErrorStatusCode(err)).json(APIResponse.error(err instanceof Error ? err.message : 'Failed'));
    }
  };
}
