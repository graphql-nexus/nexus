/// <reference path="./kitchen-sink-typegen.ts" />
import { ApolloServer } from "apollo-server";
import {
  makeSchema,
  nullabilityGuardPlugin,
  fieldAuthorizePlugin,
  connectionPlugin,
} from "nexus";
import path from "path";
import * as types from "./kitchen-sink-definitions";
import { logMutationTimePlugin } from "./example-plugins";

const DEBUGGING_CURSOR = false;

let fn = DEBUGGING_CURSOR ? (i: string) => i : undefined;

const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../kitchen-sink-schema.graphql"),
    typegen: path.join(__dirname, "./kitchen-sink-typegen.ts"),
  },
  plugins: [
    connectionPlugin({
      encodeCursor: fn,
      decodeCursor: fn,
    }),
    logMutationTimePlugin,
    fieldAuthorizePlugin(),
    nullabilityGuardPlugin({
      shouldGuard: true,
      fallbackValues: {
        ID: () => "MISSING_ID",
        Int: () => -1,
        Date: () => new Date(0),
        Boolean: () => false,
        String: () => "",
      },
    }),
  ],
  prettierConfig: path.join(__dirname, "../../../.prettierrc"),
});

const server = new ApolloServer({
  schema,
});

const port = process.env.PORT || 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
