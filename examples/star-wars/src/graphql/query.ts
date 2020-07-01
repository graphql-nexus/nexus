import { objectType, arg, stringArg } from "@nexus/schema";
import { getHero, getHuman, getDroid } from "../data";

const characterArgs = {
  id: stringArg({
    required: true,
    description: "id of the character",
  }),
};

const heroArgs = {
  episode: arg({
    type: "Episode",
    description:
      "If omitted, returns the hero of the whole saga. If provided, returns the hero of that particular episode.",
  }),
};

export const Query = objectType({
  name: "Query",
  definition(t) {
    t.field("hero", {
      type: "Character",
      args: heroArgs,
      resolve: (_, { episode }) => getHero(episode),
    });
    t.field("human", {
      type: "Human",
      args: characterArgs,
      resolve: (_, { id }) => getHuman(id),
    });
    t.field("droid", {
      type: "Droid",
      args: characterArgs,
      resolve: (_, { id }) => getDroid(id),
    });
  },
});
