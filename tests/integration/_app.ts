import "./_app.typegen";
import {
  objectType,
  idArg,
  queryType,
  mutationType,
  stringArg,
  inputObjectType,
  extendType,
  dynamicOutputMethod,
  dynamicInputMethod,
  dynamicOutputProperty,
} from "../../src";

export const query = queryType({
  definition(t) {
    t.string("foo", () => "bar");
  },
});

const mockData = {
  posts: [{ title: "", body: "" }],
  user: { firstName: "", lastName: "" },
};

export const dom = dynamicOutputMethod({
  name: "title",
  typeDefinition: "(options: { escape: boolean }): void",
  factory: ({ typeDef: t }) => {
    t.string("title");
  },
});

export const dim = dynamicInputMethod({
  name: "title",
  factory: ({ typeDef: t }) => {
    t.string("title", { nullable: true });
  },
});

export const dop = dynamicOutputProperty({
  name: "body",
  factory: ({ typeDef: t }) => {
    t.string("body");
  },
});

export const PostSearchInput = inputObjectType({
  name: "PostSearchInput",
  definition(t) {
    t.title();
    t.string("body", { nullable: true });
  },
});

export const Post = objectType({
  name: "Post",
  definition(t) {
    t.title({ escape: true });
    // tslint:disable-next-line: no-unused-expression
    t.body;
  },
});

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("firstName");
    t.string("lastName");
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
