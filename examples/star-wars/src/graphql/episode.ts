import { enumType } from "nexus";

/**
 * Note: this could also be:
 *
 * enumType("Episode", {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * })
 *
 * if we chose to omit the descriptions
 */
export const Episode = enumType({
  name: "Episode",
  description: "One of the films in the Star Wars Trilogy",
  members: [
    { name: "NEWHOPE", value: 4, description: "Released in 1977." },
    { name: "EMPIRE", value: 5, description: "Released in 1980." },
    { name: "JEDI", value: 6, description: "Released in 1983" },
  ],
});

export const MoreEpisodes = enumType("MoreEpisodes", (t) => {
  t.mix("Episode");
  t.members(["OTHER"]);
});
