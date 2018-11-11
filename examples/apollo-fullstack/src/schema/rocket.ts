import { GQLiteralObject } from "gqliteral";

export const Rocket = GQLiteralObject("Rocket", (t) => {
  t.id("id");
  t.string("name", { nullable: true });
  t.string("type", { nullable: true });
});
