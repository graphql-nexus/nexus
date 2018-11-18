// @ts-check
import { ApolloServer } from "apollo-server";
import path from "path";
import { GQLiteralSchema } from "gqliteral";
import isEmail from "isemail";
import * as types from "./schema";
import { Request } from "express";

const { createStore } = require("fullstack-tutorial/final/server/src/utils.js");
const internalEngineDemo = require("fullstack-tutorial/final/server/src/engine-demo");
const LaunchApi = require("fullstack-tutorial/final/server/src/datasources/launch.js");
const UserApi = require("fullstack-tutorial/final/server/src/datasources/user.js");

const schema = GQLiteralSchema({
  types,
  schemaFilePath: path.join(__dirname, "../fullstack-schema.graphql"),
  typeGeneration: {
    outputPath: path.join(__dirname, "../src/fullstackTypes.ts"),
    imports: {
      t: path.join(__dirname, "../src/typeDefs.ts"),
    },
    contextType: "t.Context",
    rootTypes: {
      Launch: "t.Launch",
      Mission: "t.Mission",
    },
  },
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
  const email = new Buffer(auth, "base64").toString("ascii");

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

const port = 4000;

server.listen({ port }, () =>
  console.log(
    `🚀 Server ready at http://localhost:${port}${server.graphqlPath}`
  )
);
