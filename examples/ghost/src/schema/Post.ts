import { objectType } from "nexus";

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.string("uuid");
    t.string("title");
    t.string("slug");
    t.string("html", (o) => o.html || "");
  },
});
