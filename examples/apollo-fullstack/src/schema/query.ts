/// <reference path="../fullstackTypes.ts" />
import { GQLiteralObject } from "gqliteral";
import { Utils } from "../typeDefs";
const utils: Utils = require("fullstack-tutorial/final/server/src/utils.js");

const dataSources: any = {};

export const Query = GQLiteralObject("Query", (t) => {
  t.field("launches", "LaunchConnection", {
    args: {
      pageSize: t.intArg({
        description:
          "The number of results to show. Must be >= 1. Default = 20",
      }),
      after: t.stringArg({
        description:
          "If you add a cursor here, it will only return results _after_ this cursor",
      }),
    },
    resolve: async (root, { pageSize = 20, after }, { dataSources }) => {
      const allLaunches = await dataSources.launchAPI.getAllLaunches();
      // we want these in reverse chronological order
      allLaunches.reverse();

      const launches = utils.paginateResults({
        after,
        pageSize,
        results: allLaunches,
      });

      return {
        launches,
        cursor: launches.length ? launches[launches.length - 1].cursor : null,
        // if the cursor of the end of the paginated results is the same as the
        // last item in _all_ results, then there are no more results after this
        hasMore: launches.length
          ? launches[launches.length - 1].cursor !==
            allLaunches[allLaunches.length - 1].cursor
          : false,
      };
    },
  });
  t.field("launch", "Launch", {
    args: {
      id: t.idArg({ required: true }),
      count: t.intArg(),
    },
    resolve: (_, args) => {
      return dataSources.launchAPI.getLaunchById({ launchId: args.id });
    },
  });
  t.field("me", "User", {
    nullable: true,
    resolve: (root, args, ctx) => {
      return ctx.dataSources.userAPI.findOrCreateUser();
    },
  });
});
