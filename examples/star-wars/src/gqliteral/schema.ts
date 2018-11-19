import * as path from "path";
import * as allTypes from "./types";
import { buildSchema } from "gqliteral";

/**
 * Finally, we construct our schema (whose starting query type is the query
 * type we defined above) and export it.
 */
export const schema = buildSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, "../../star-wars-schema.graphql"),
    typegen: path.join(__dirname, "../generatedTypes.ts"),
  },
  typegenImports: {
    swapi: path.join(__dirname, "rootTypes.ts"),
  },
  rootTypes: {
    // Droid: "swapi.Droid",
    Human: "swapi.Human",
  },
});
