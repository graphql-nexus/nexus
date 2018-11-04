import { GQLiteralObject } from "../../../../src";

export const Post = GQLiteralObject("Post", t => {
  t.implements("Node");
});
