import { GQLiteralObject } from "../../../../../src";

export const Droid = GQLiteralObject("Droid", (t) => {
  t.description("A mechanical creature in the Star Wars universe.");
  t.implements("Character");
  t.string("primaryFunction", {
    description: "The primary function of the droid.",
    defaultValue: "N/A",
  });
});
