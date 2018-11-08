import { GQLiteralObject, GQLiteralArg } from "../../../../../src";
import { getHero, getHuman, getDroid } from "../data";

const characterIdArg = GQLiteralArg("String", {
  required: true,
  description: "id of the character",
});

export const Query = GQLiteralObject("Query", (t) => {
  t.field("hero", "Character", {
    args: {
      episode: GQLiteralArg("Episode", {
        description:
          "If omitted, returns the hero of the whole saga. If provided, returns the hero of that particular episode.",
      }),
    },
    resolve: (root, { episode }) => getHero(episode),
  });
  t.field("human", "Human", {
    args: {
      id: characterIdArg,
    },
    resolve: (root, { id }) => getHuman(id),
  });
  t.field("droid", "Droid", {
    args: {
      id: characterIdArg,
    },
    resolve: (root, { id }) => getDroid(id),
  });
});
