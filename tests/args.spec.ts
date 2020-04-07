import { graphql } from "graphql";
import {
  arg,
  booleanArg,
  floatArg,
  idArg,
  intArg,
  makeSchema,
  objectType,
  queryField,
  stringArg,
} from "../src/core";

describe("interfaceType", () => {
  let schema: ReturnType<typeof makeSchema>;
  beforeAll(() => {
    schema = makeSchema({
      types: [
        queryField("user", {
          type: "User",
          args: {
            int: intArg(),
            bool: booleanArg(),
            float: floatArg(),
            id: idArg(),
            str: stringArg(),
          },
          resolve: () => ({ id: `User:1`, name: "Test User" }),
        }),
        objectType({
          name: "User",
          definition(t) {
            t.id("id");
            t.string("name");
          },
        }),
      ],
      outputs: false,
      shouldGenerateArtifacts: false,
    });
  });
  it("can be implemented by object types", async () => {
    expect(
      await graphql(
        schema,
        `
          {
            user(int: 1, bool: true, float: 123.45, str: "Test") {
              id
              name
            }
          }
        `
      )
    ).toMatchSnapshot();
  });
  it("throws if the arg is not provided to the type", async () => {
    // @ts-ignore
    expect(() => arg({ type: null })).toThrowErrorMatchingSnapshot();
  });
});
