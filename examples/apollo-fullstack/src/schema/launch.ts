import { objectType } from "nexus";
import dedent from "dedent";

export const Launch = objectType({
  name: "Launch",
  definition: (t) => {
    t.id("id");
    t.string("site", { nullable: true });
    t.field("mission", { type: "Mission" });
    t.field("rocket", { type: "Rocket" });
    t.boolean("isBooked", (launch, _, { dataSources }) => {
      return dataSources.userAPI.isBookedOnLaunch({
        launchId: `${launch.id}`,
      });
    });
  },
});

export const LaunchConnection = objectType({
  name: "LaunchConnection",
  description: dedent`
    Simple wrapper around our list of launches that contains a cursor to the
    last item in the list. Pass this cursor to the launches query to fetch results
    after these.
  `,
  definition: (t) => {
    t.string("cursor", { nullable: true });
    t.boolean("hasMore");
    t.field("launches", { type: "Launch", list: [false] });
  },
});
