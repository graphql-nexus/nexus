declare module "ghost" {
  import { Express } from "express";
  class GhostServer {
    rootApp: Express;
    start(app?: Express.Application): void;
  }
  declare const Ghost = async () => new GhostServer();
  export = Ghost;
}

declare module "ghost/core/server/data/db" {
  import Knex from "knex";
  declare const knex: ReturnType<typeof Knex>;
  export { knex };
}

declare module "ghost/core/server/web/parent-app" {
  import express from "express";
  declare const setupParentApp = () => express.application;
  export = setupParentApp;
}
