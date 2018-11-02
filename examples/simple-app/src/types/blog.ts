import { GQLitObject } from "../../../../src";

export const Blog = GQLitObject("Blog", t => {
  t.field("id", "ID");
  t.field("title", "String", { description: "The title of the blog" });
  t.list("posts", "Post");
});
