import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export const PUBLIC_USER_COLUMNS = ['id', 'full_name'] as const;
export const USER_CONTACT_COLUMNS = ['id', 'full_name', 'email', 'phone'] as const;

export function joinUserColumns<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  relation: string,
  alias: string,
  columns: readonly string[],
): SelectQueryBuilder<T> {
  return qb.leftJoin(relation, alias).addSelect(columns.map((column) => `${alias}.${column}`));
}

export function joinPublicUser<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  relation: string,
  alias: string,
): SelectQueryBuilder<T> {
  return joinUserColumns(qb, relation, alias, PUBLIC_USER_COLUMNS);
}
