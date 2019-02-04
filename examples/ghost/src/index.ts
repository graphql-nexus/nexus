import ghost from "ghost";
import db from "ghost/core/server/data/db";
import { ApolloServer } from "apollo-server-express";
import express from "express";
import { schema } from "./ghost-schema";
import { Context } from "./data-sources/Context";
import { knex } from "./utils/knexInstance";

const demoApp = express();

// Note: This isn't (yet) protected by any sort of
// authentication/authorization, so don't try running queries in
// production.
ghost().then((ghostServer) => {
  const apolloServer = new ApolloServer({
    schema,
    context: () => new Context(),
  });
  apolloServer.applyMiddleware({ app: demoApp });
  demoApp.use("/", ghostServer.rootApp);
  ghostServer.start(demoApp);
  console.log("Ghost server Ready!");
});
function closeKnex() {
  db.knex.destroy();
  knex.destroy();
}
process.on("SIGTERM", closeKnex);
process.on("SIGINT", closeKnex);
