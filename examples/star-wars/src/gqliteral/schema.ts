import * as path from "path";
import { GQLiteralSchema } from "gqliteral";
import * as allTypes from "./types";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = GQLiteralSchema({
  types: allTypes,
  definitionFilePath: path.join(__dirname, "../schema.graphql"),
});
