import { objectType } from "gqliteral";

export const User = objectType("User", (t) => {
  t.id("id");
  t.string("email");
  t.field("trips", "Launch", {
    list: true,
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
});
