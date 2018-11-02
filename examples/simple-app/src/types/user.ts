import { GQLitObject } from "../../../../src";

export const User = GQLitObject("User", t => {
  t.mix("Node");
});
