import * as path from "path";
import { GQLiteralSchema } from "../../../../src";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const StarWarsSchema = GQLiteralSchema({
  types: [],
  definitionFilePath: path.join(__dirname, "../schema.graphql"),
});
