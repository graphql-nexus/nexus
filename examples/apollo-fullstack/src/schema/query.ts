/// <reference path="../fullstack-typegen.ts" />
import { objectType, idArg, intArg, stringArg, core } from "nexus";
import { Utils } from "../typeDefs";
const utils: Utils = require("fullstack-tutorial/final/server/src/utils.js");

export const Query = objectType({
  name: "Query",
  definition(t) {
    // t.field('launches', {})
    // https://clearbit.com/
    t.field("launches", {
      type: "LaunchConnection",
      args: {
        pageSize: intArg({
          description:
            "The number of results to show. Must be >= 1. Default = 20",
        }),
        after: stringArg({
          description:
            "If you add a cursor here, it will only return results _after_ this cursor",
        }),
      },
      async resolve(root, { pageSize = 20, after }, { dataSources }) {
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
    t.field("launch", {
      type: "Launch",
      args: {
        id: idArg({ required: true }),
        count: intArg(),
      },
      resolve: (_, args, { dataSources }) => {
        return dataSources.launchAPI.getLaunchById({ launchId: args.id });
      },
    });
    t.field("me", {
      type: "User",
      nullable: true,
      resolve: (root, args, ctx) => {
        return ctx.dataSources.userAPI.findOrCreateUser();
      },
    });
  },
});
