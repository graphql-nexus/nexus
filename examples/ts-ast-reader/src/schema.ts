import { makeSchema } from "gqliteral";
import path from "path";
import * as types from "./types";

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../ts-ast-reader-schema.graphql"),
    typegen: path.join(__dirname, "ts-ast-reader-typegen.ts"),
  },
  typegenAutoConfig: {
    sources: [
      {
        alias: "ts",
        module: "typescript",
        glob: false,
      },
      {
        alias: "t",
        module: path.join(__dirname, "./types/index.ts"),
        onlyTypes: [],
      },
    ],
    contextType: "t.ContextType",
    backingTypeMap: {
      Token: "ts.Token<any>",
    },
  },
});
