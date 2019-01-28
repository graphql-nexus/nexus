import { objectType } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.string("email");
    t.list.field("trips", {
      type: "Launch",
      async resolve(_, __, { dataSources }) {
        // get ids of launches by user
        const launchIds = await dataSources.userAPI.getLaunchIdsByUser();
        if (!launchIds.length) {
          return [];
        }
        // look up those launches by their ids
        return (
          dataSources.launchAPI.getLaunchesByIds({
            launchIds,
          }) || []
        );
      },
    });
  },
});
