import { GQLiteralObject } from "../../../../../src";

export const Planet = GQLiteralObject("Planet", t => {
  t.description(`A large mass, planet or planetoid in the Star Wars Universe, at the time of
  0 ABY.`);
  t.string("name", { description: "The name of this planet." });
  t.int("diameter");
});
