import { makeSchema } from "gqliteral";
import path from "path";
import * as types from "./types";

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../ts-ast-reader-schema.graphql"),
    typegen: path.join(__dirname, "ts-ast-reader-typegen.ts"),
  },
});
