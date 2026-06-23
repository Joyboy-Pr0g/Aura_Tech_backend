export class APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  next_cursor?: string | null;
  has_more?: boolean;
  error?: { message: string };

  private constructor(partial: Partial<APIResponse<T>>) {
    this.success = partial.success!;
    this.message = partial.message!;
    if (partial.data !== undefined) this.data = partial.data;
    if (partial.next_cursor !== undefined) this.next_cursor = partial.next_cursor;
    if (partial.has_more !== undefined) this.has_more = partial.has_more;
    if (partial.error !== undefined) this.error = partial.error;
  }

  static success<T>(
    message: string,
    data?: T,
    nextCursor?: string | null,
    hasMore?: boolean,
  ): APIResponse<T> {
    return new APIResponse<T>({
      success: true,
      message,
      data,
      next_cursor: nextCursor ?? null,
      has_more: hasMore ?? false,
    });
  }

  static error(message: string): APIResponse<null> {
    return new APIResponse<null>({
      success: false,
      message,
      error: { message },
    });
  }
}
