import { objectType } from "nexus";

export const Droid = objectType("Droid", (t) => {
  t.description("A mechanical creature in the Star Wars universe.");
  t.implements("Character");
  t.string("primaryFunction", {
    description: "The primary function of the droid.",
    default: "N/A",
  });
});
