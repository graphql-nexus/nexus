import { GraphQLSchema } from "graphql";
import { interfaceType, makeSchema, objectType } from "../../src";

describe("GH #361, interfaceType & implements", () => {
  test("should pass", () => {
    const Node = interfaceType({
      name: "Node",
      definition(t) {
        t.id("id", { description: "Unique identifier for the resource" });
        t.resolveType(() => null);
      },
    });

    const User = objectType({
      name: "User",
      definition(t) {
        t.implements(Node);
        t.string("username");
        t.string("email");
      },
    });

    const schema = makeSchema({
      types: [User],
      outputs: false,
    });

    expect(schema).toBeInstanceOf(GraphQLSchema);
  });
});
