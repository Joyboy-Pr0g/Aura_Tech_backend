import { Brackets, SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export const DEFAULT_LIMIT = 20;

export interface DecodedCursor {
  created_at: Date;
  id: string;
}

export type CursorDecodeResult = DecodedCursor | null | 'invalid';

export interface CursorListResult<T> {
  items: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function encodeCreatedAtIdCursor(row: {
  created_at: Date | string;
  id: string;
}): string {
  const created_at =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at);
  const payload = JSON.stringify({ created_at, id: row.id });
  return Buffer.from(payload, 'utf8').toString('base64url');
}

export function decodeCreatedAtIdCursor(
  cursor: string | undefined,
): CursorDecodeResult {
  if (cursor === undefined || cursor === null || String(cursor).trim() === '') {
    return null;
  }
  try {
    const json = Buffer.from(cursor, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { created_at?: string; id?: string };
    if (
      typeof parsed.created_at !== 'string' ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    ) {
      return 'invalid';
    }
    const created_at = new Date(parsed.created_at);
    if (Number.isNaN(created_at.getTime())) {
      return 'invalid';
    }
    return { created_at, id: parsed.id };
  } catch {
    return 'invalid';
  }
}

/** Apply DESC (created_at, id) keyset filter to a TypeORM query builder. */
export function applyCreatedAtIdCursorDesc<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
  cursor: DecodedCursor | null,
): void {
  if (!cursor) return;
  qb.andWhere(
    new Brackets((sub) => {
      sub
        .where(`${alias}.created_at < :c_created_at`, {
          c_created_at: cursor.created_at,
        })
        .orWhere(
          new Brackets((inner) => {
            inner
              .where(`${alias}.created_at = :c_created_at_eq`, {
                c_created_at_eq: cursor.created_at,
              })
              .andWhere(`${alias}.id < :c_id`, { c_id: cursor.id });
          }),
        );
    }),
  );
}

export function paginateByCursor<T extends { created_at: Date | string; id: string }, R = T>(
  rows: T[],
  limit: number,
  mapper?: (item: T) => R,
  cursorMapper: (item: T) => { created_at: Date | string; id: string } = (item) => item,
): CursorListResult<R> {
  const has_more = rows.length > limit;

  const items = has_more ? rows.slice(0, limit) : rows;

  const mappedItems = mapper
    ? items.map(mapper)
    : (items as unknown as R[]);

  const next_cursor =
    has_more && items.length > 0
      ? encodeCreatedAtIdCursor(cursorMapper(items[items.length - 1]!))
      : null;

  return {
    items: mappedItems,
    next_cursor,
    has_more,
  };
}
