import * as path from "path";
import * as allTypes from "./types";
import { GQLiteralSchema } from "gqliteral";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = GQLiteralSchema({
  types: allTypes,
  schemaPath: path.join(__dirname, "../../star-wars-schema.graphql"),
  typegenPath: path.join(__dirname, "../generatedTypes.ts"),
  typegenImports: {
    swapi: path.join(__dirname, "rootTypes.ts"),
  },
  rootTypes: {
    // Droid: "swapi.Droid",
    Human: "swapi.Human",
  },
});
