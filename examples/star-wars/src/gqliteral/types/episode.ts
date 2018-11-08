import { GQLiteralEnum } from "../../../../../src";

/**
 * Note: this could also be:
 *
 * GQLiteralEnum("Episode", {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * })
 *
 * if we chose to omit the descriptions.
 */
export const Episode = GQLiteralEnum("Episode", (t) => {
  t.description("One of the films in the Star Wars Trilogy");
  t.members([
    {
      name: "NEWHOPE",
      value: 4,
      description: "Released in 1977.",
    },
    {
      name: "EMPIRE",
      value: 5,
      description: "Released in 1980.",
    },
    {
      name: "JEDI",
      value: 6,
      description: "Released in 1983",
    },
  ]);
});
