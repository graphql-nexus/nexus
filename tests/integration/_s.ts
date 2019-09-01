import "./_s.typegen";
import {
  objectType,
  idArg,
  mutationType,
  stringArg,
  inputObjectType,
  extendType,
  dynamicOutputMethod,
} from "../../src";
export * from "./_xs";

const mockData = {
  posts: [{ title: "", body: "" }],
  user: { firstName: "", lastName: "" },
};

dynamicOutputMethod({
  name: "test",
  factory: ({ typeDef }) => {
    typeDef.boolean("boolViaDynamic");
  },
});

export const PostSearchInput = inputObjectType({
  name: "PostSearchInput",
  definition(t) {
    t.string("title", { nullable: true });
    t.string("body", { nullable: true });
  },
});

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.string("title");
    t.string("body");
  },
});

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("firstName");
    t.string("lastName");
    // t.test()
  },
});

export const Query = extendType({
  type: "Query",
  definition(t) {
    t.list.field("searchPosts", {
      type: "Post",
      args: { input: PostSearchInput },
      resolve: () => mockData.posts,
    });
    t.field("user", {
      type: "User",
      args: { id: idArg() },
      resolve: () => mockData.user,
    });
  },
});

export const Mutation = mutationType({
  definition(t) {
    t.field("createUser", {
      type: "User",
      args: { firstName: stringArg(), lastName: stringArg() },
      resolve: (_root) => ({ firstName: "", lastName: "" }),
    });
  },
});
