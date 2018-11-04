import { GQLiteralObject } from "../../../../src";

export const Blog = GQLiteralObject("Blog", t => {
  t.field("id", "ID");
  t.field("title", "String", { description: "The title of the blog" });
  t.list("posts", "Post");
});
