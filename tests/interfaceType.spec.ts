import { graphql } from "graphql";
import path from "path";
import {
  interfaceType,
  makeSchema,
  objectType,
  queryField,
} from "../src/core";

describe("interfaceType", () => {
  it("can be implemented by object types", async () => {
    const schema = makeSchema({
      types: [
        interfaceType({
          name: "Node",
          definition(t) {
            t.id("id");
            t.resolveType(() => null);
          },
        }),
        objectType({
          name: "User",
          definition(t) {
            t.implements("Node");
            t.string("name");
          },
        }),
        queryField("user", {
          type: "User",
          resolve: () => ({ id: `User:1`, name: "Test User" }),
        }),
      ],
      outputs: {
        schema: path.join(__dirname, "interfaceTypeTest.graphql"),
        typegen: false,
      },
      shouldGenerateArtifacts: false,
    });
    expect(
      await graphql(
        schema,
        `
          {
            user {
              id
              name
            }
          }
        `
      )
    ).toMatchSnapshot();
  });
});