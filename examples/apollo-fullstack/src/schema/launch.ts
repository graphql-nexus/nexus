import { objectType } from "nexus";

export const Launch = objectType({
  name: "Launch",
  definition: (t) => {
    t.id("id");
    t.string("site", { nullable: true });
    t.field("mission", "Mission");
    t.field("rocket", "Rocket");
    t.boolean("isBooked", {
      async resolve(launch, _, { dataSources }) {
        return dataSources.userAPI.isBookedOnLaunch({
          launchId: `${launch.id}`,
        });
      },
    });
  },
});

export const LaunchConnection = objectType({
  name: "LaunchConnection",
  definition: (t) => {
    t.description(`
      Simple wrapper around our list of launches that contains a cursor to the
      last item in the list. Pass this cursor to the launches query to fetch results
      after these.
    `);
    t.string("cursor", { nullable: true });
    t.boolean("hasMore");
    t.field("launches", "Launch", { list: true, listItemNullable: true });
  },
});
