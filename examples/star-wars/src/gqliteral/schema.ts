import * as path from "path";
import * as allTypes from "./types";
import { GQLiteralSchema } from "gqliteral";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = GQLiteralSchema({
  types: allTypes,
  definitionFilePath: path.join(__dirname, "../../star-wars-schema.graphql"),
  typeGeneration: {
    typesFilePath: path.join(__dirname, "../generatedTypes.ts"),
    imports: {
      swapi: path.join(__dirname, "backingTypes.ts"),
    },
    backingTypes: {
      Droid: "swapi.Droid",
      Human: "swapi.Human",
    },
  },
});
