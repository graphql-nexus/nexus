import * as path from "path";
import * as allTypes from "./graphql";
import { makeSchema } from "gqliteral";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = makeSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, "../star-wars-schema.graphql"),
    typegen: path.join(__dirname, "./generatedTypes.ts"),
  },
  typegen: {
    imports: {
      swapi: path.join(__dirname, "types/backingTypes.ts"),
    },
    rootTypes: {
      Droid: "swapi.Droid",
      Human: "swapi.Human",
    },
  },
});
