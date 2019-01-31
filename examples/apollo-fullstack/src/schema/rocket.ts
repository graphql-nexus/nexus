import { objectType } from "nexus";

export const Rocket = objectType({
  name: "Rocket",
  definition(t) {
    t.id("id");
    t.string("name", { nullable: true });
    t.string("type", { nullable: true });
  },
});
