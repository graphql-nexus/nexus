import { objectType } from "gqliteral";

export const Human = objectType("Human", (t) => {
  t.description("A humanoid creature in the Star Wars universe.");
  t.implements("Character");
  t.string("homePlanet", {
    nullable: true,
    description: "The home planet of the human, or null if unknown.",
    property: "home_planet",
  });
});
