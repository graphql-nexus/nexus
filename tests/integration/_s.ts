import {
  objectType,
  idArg,
  queryType,
  mutationType,
  stringArg,
  inputObjectType,
} from "../../src";

const mockData = {
  posts: [{ title: "", body: "" }],
  user: { firstName: "", lastName: "" },
};

export const postSearchInput = inputObjectType({
  name: "PostSearchInput",
  definition(t) {
    t.string("title", { nullable: true });
    t.string("body", { nullable: true });
  },
});

export const post = objectType({
  name: "Post",
  definition(t) {
    t.string("title");
    t.string("body");
  },
});

export const user = objectType({
  name: "User",
  definition(t) {
    t.string("firstName");
    t.string("lastName");
  },
});

export const query = queryType({
  definition(t) {
    t.list.field("searchPosts", {
      type: "Post",
      args: { input: postSearchInput },
      resolve: () => mockData.posts,
    });
    t.field("user", {
      type: "User",
      args: { id: idArg() },
      resolve: () => mockData.user,
    });
  },
});

export const mutation = mutationType({
  definition(t) {
    t.field("createUser", {
      type: "User",
      args: { firstName: stringArg(), lastName: stringArg() },
      resolve: (_root) => ({ firstName: "", lastName: "" }),
    });
  },
});
