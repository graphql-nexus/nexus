import { objectType } from "@nexus/schema";

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.string("uuid");
    t.string("title");
    t.string("slug");
    t.string("html", (o) => o.html || "");
  },
});
