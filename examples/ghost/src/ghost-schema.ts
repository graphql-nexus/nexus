import { makeSchema, authorizePlugin } from "nexus";
import path from "path";
import * as allTypes from "./schema";

export const schema = makeSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, "ghost-schema.graphql"),
    typegen: path.join(__dirname, "generated", "ghost-nexus.ts"),
  },
  plugins: [authorizePlugin()],
  typegenAutoConfig: {
    contextType: "ctx.Context",
    sources: [
      {
        alias: "ctx",
        source: path.join(__dirname, "data-sources", "Context.ts"),
      },
      {
        alias: "db",
        source: path.join(__dirname, "generated", "ghost-db-types.ts"),
        typeMatch: (type) => new RegExp(`(?:interface)\\s+(${type.name}s)\\W`),
      },
    ],
    backingTypeMap: {
      Date: "Date",
    },
  },
  prettierConfig: {},
});
