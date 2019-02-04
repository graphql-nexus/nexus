import _ from "lodash";
import { DBTables } from "../generated/ghost-db-tables";
import { Context } from "../data-sources/Context";

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
