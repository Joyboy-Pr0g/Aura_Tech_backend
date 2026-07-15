export class APIResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  next_cursor?: string | null;
  has_more?: boolean;
  error?: { message: string; details?: unknown };

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
    extras?: { next_cursor?: string | null; has_more?: boolean },
  ): APIResponse<T> {
    return new APIResponse<T>({
      success: true,
      message,
      data,
      ...(extras
        ? {
            next_cursor: extras.next_cursor ?? null,
            has_more: extras.has_more ?? false,
          }
        : {}),
    });
  }

  static error(message: string, details?: unknown): APIResponse<null> {
    return new APIResponse<null>({
      success: false,
      message,
      error: { message, details },
    });
  }
}
