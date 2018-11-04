import { GQLiteralObject } from "../../../../src";

export const User = GQLiteralObject("User", t => {
  t.mix("Node");
});
