import { GQLiteralObject, GQLiteralArg } from "gqliteral";
import { getHero, getHuman, getDroid } from "../data";
import { Gen } from "../../generatedTypes";

const characterArgs = {
  id: GQLiteralArg("String", {
    required: true,
    description: "id of the character",
  }),
};

const heroArgs = {
  episode: GQLiteralArg("Episode", {
    description:
      "If omitted, returns the hero of the whole saga. If provided, returns the hero of that particular episode.",
  }),
};

export const Query = GQLiteralObject<Gen, "Query">("Query", (t) => {
  t.field("hero", "Character", {
    args: heroArgs,
    resolve: (_, { episode }) => getHero(episode),
  });
  t.field("human", "Human", {
    args: characterArgs,
    resolve: (_, { id }) => getHuman(id),
  });
  t.field("droid", "Droid", {
    args: characterArgs,
    resolve: (_, { id }) => getDroid(id),
  });
});
