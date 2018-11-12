import { GQLiteralInterface, GQLiteralArg } from "gqliteral";
import { getFriends } from "../data";

export const Character = GQLiteralInterface("Character", (t) => {
  t.description("A character in the Star Wars Trilogy");
  t.string("id", { description: "The id of the character" });
  t.string("name", { description: "The name of the character" });
  t.field("friends", "Character", {
    list: true,
    description:
      "The friends of the character, or an empty list if they have none.",
    resolve: (character) => getFriends(character),
  });
  t.field("appearsIn", "Episode", {
    list: true,
    description: "Which movies they appear in.",
    property: "appears_in",
    args: {
      id: GQLiteralArg("ID", { required: true }),
    },
  });
  t.resolveType((character) => character.type);
});
