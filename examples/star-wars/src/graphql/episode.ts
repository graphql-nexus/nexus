import { enumType } from "nexus";

const OriginalEpisodes = [
  { name: "NEWHOPE", value: 4, description: "Released in 1977." },
  { name: "EMPIRE", value: 5, description: "Released in 1980." },
  { name: "JEDI", value: 6, description: "Released in 1983" },
];

export const Episode = enumType({
  name: "Episode",
  description: "One of the films in the Star Wars Trilogy",
  members: OriginalEpisodes,
});

export const MoreEpisodes = enumType({
  name: "MoreEpisodes",
  members: [...OriginalEpisodes, "OTHER"],
});
