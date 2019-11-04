// @ts-check
import { ApolloServer } from "apollo-server";
import path from "path";
import { makeSchema } from "nexus";
import isEmail from "isemail";
import * as types from "./schema";
import { Request } from "express";

const { createStore } = require("fullstack-tutorial/final/server/src/utils.js");
const internalEngineDemo = require("fullstack-tutorial/final/server/src/engine-demo");
const LaunchApi = require("fullstack-tutorial/final/server/src/datasources/launch.js");
const UserApi = require("fullstack-tutorial/final/server/src/datasources/user.js");

const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, "../fullstack-schema.graphql"),
    typegen: path.join(
      __dirname.replace(/\/dist$/, "/src"),
      "../src/fullstack-typegen.ts"
    ),
  },
  typegenAutoConfig: {
    sources: [
      {
        source: path.join(
          __dirname.replace(/\/dist$/, "/src"),
          "./typeDefs.ts"
        ),
        alias: "t",
      },
    ],
    contextType: "t.Context",
  },
  prettierConfig: path.join(__dirname, "../../../.prettierrc"),
});

const store = createStore();

const dataSources = () => ({
  launchAPI: new LaunchApi(),
  userAPI: new UserApi({ store }),
});

// the function that sets up the global context for each resolver, using the req
const context = async ({ req }: { req: Request }) => {
  // simple auth check on every request
  const auth = (req.headers && req.headers.authorization) || "";
  const email = Buffer.from(auth, "base64").toString("ascii");

  // if the email isn't formatted validly, return null for user
  if (!isEmail.validate(email)) {
    return { user: null };
  }
  // find a user by their email
  const users = await store.users.findOrCreate({ where: { email } });
  const user = users && users[0] ? users[0] : null;

  return { user: { ...user.dataValues } };
};

const server = new ApolloServer({
  schema,
  dataSources,
  context,
  engine: {
    apiKey: process.env.ENGINE_API_KEY,
    ...internalEngineDemo,
  },
});

const port = process.env.PORT || 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
