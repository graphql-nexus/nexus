import * as path from "path";
import * as allTypes from "./types";
import { GQLiteralSchema } from "gqliteral";
import { GQLiteralTypegen } from "gqliteral-typegen";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = GQLiteralSchema({
  types: allTypes,
  definitionFilePath: path.join(__dirname, "../schema.graphql"),
  typeGeneration: GQLiteralTypegen({
    typesFilePath: path.join(__dirname, "../generatedTypes.ts"),
    backingTypes: {
      Query: {
        something: 1,
      },
      Droid: 1,
    },
  }),
});
