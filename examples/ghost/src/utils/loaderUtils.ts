import _ from "lodash";
import { DBTables } from "../generated/ghost-db-tables";
import { Context } from "../data-sources/Context";
import { QueryBuilder } from "knex";

export function byColumnLoader<
  Tbl extends keyof DBTables,
  Key extends Extract<keyof DBTables[Tbl], string>,
  KeyType extends Extract<DBTables[Tbl][Key], string | number>
>(
  ctx: Context,
  table: Tbl,
  key: Key,
  keys: KeyType[]
): PromiseLike<DBTables[Tbl][]> {
  return ctx
    .knex(table)
    .select(`${table}.*`)
    .whereIn(`${table}.${key}`, keys)
    .then((rows: DBTables[Tbl][]) => {
      const keyed: Record<KeyType, DBTables[Tbl]> = _.keyBy(rows, key);
      return keys.map((k) => {
        return keyed[k] || new Error(`Missing row for ${table}:${key} ${k}`);
      });
    });
}

/**
 * A type-safe loader for loading many of a particular item,
 * grouped by an individual key.
 * @param ctx
 * @param table
 * @param key
 * @param keys
 */
export function manyByColumnLoader<
  Tbl extends keyof DBTables,
  Key extends Extract<keyof DBTables[Tbl], string>,
  KeyType extends Extract<DBTables[Tbl][Key], string | number>
>(
  ctx: Context,
  tableName: Tbl,
  key: Key,
  keys: KeyType[],
  scope: (qb: QueryBuilder) => QueryBuilder = (qb) => qb
) {
  const builder = ctx
    .knex(tableName)
    .select(`${tableName}.*`)
    .whereIn(`${tableName}.${key}`, _.uniq(keys));
  return scope(builder).then((rows: DBTables[Tbl][]) => {
    const grouped = _.groupBy(rows, key);
    return keys.map((id) => grouped[id] || []);
  });
}
