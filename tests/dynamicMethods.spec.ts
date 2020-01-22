import path from "path";
import { GraphQLDateTime } from "graphql-iso-date";
import {
  makeSchema,
  objectType,
  queryType,
  inputObjectType,
  dynamicInputMethod,
  decorateType,
  ext,
} from "../src";
import { graphql } from "graphql";
import { CatListFixture } from "./_fixtures";
import { dynamicOutputProperty } from "../src/dynamicProperty";

let spy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
});

describe("dynamicOutputMethod", () => {
  const Cat = objectType({
    name: "Cat",
    definition(t) {
      t.id("id");
      t.string("name");
    },
  });

  test("RelayConnectionFieldMethod example", async () => {
    const Query = queryType({
      definition(t) {
        // @ts-ignore
        t.relayConnectionField("cats", {
          type: Cat,
          pageInfo: () => ({
            hasNextPage: false,
            hasPreviousPage: false,
          }),
          edges: () =>
            CatListFixture.map((c) => ({ cursor: `Cursor: ${c.id}`, node: c })),
        });
      },
    });
    const schema = makeSchema({
      types: [Query, ext.RelayConnectionFieldMethod],
      outputs: {
        typegen: path.join(__dirname, "test-output.ts"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      shouldGenerateArtifacts: false,
    });
    expect(
      await graphql(
        schema,
        `
          {
            cats {
              edges {
                node {
                  id
                  name
                }
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
              }
            }
          }
        `
      )
    ).toMatchSnapshot();
  });

  test("CollectionFieldMethod example", async () => {
    const dynamicOutputMethod = queryType({
      definition(t) {
        // @ts-ignore
        t.collectionField("cats", {
          type: Cat,
          totalCount: () => CatListFixture.length,
          nodes: () => CatListFixture,
        });
      },
    });

    const schema = makeSchema({
      types: [dynamicOutputMethod, ext.CollectionFieldMethod],
      outputs: {
        typegen: path.join(__dirname, "test-output"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      shouldGenerateArtifacts: false,
    });

    expect(
      await graphql(
        schema,
        `
          {
            cats {
              totalCount
              nodes {
                id
                name
              }
            }
          }
        `
      )
    ).toMatchSnapshot();
  });

  test("CollectionFieldMethod example with string type ref", () => {
    makeSchema({
      types: [
        queryType({
          definition(t) {
            // @ts-ignore
            t.collectionField("cats", {
              type: "Cat",
              totalCount: () => CatListFixture.length,
              nodes: () => CatListFixture,
            });
          },
        }),
        ext.CollectionFieldMethod,
      ],
      outputs: false,
    });
  });

  test("RelayConnectionFieldMethod example with string type ref", async () => {
    makeSchema({
      types: [
        queryType({
          definition(t) {
            // @ts-ignore
            t.relayConnectionField("cats", {
              type: "Cat",
              nodes(root: any, args: any, ctx: any, info: any) {
                return CatListFixture;
              },
              pageInfo: () => ({
                hasNextPage: false,
                hasPreviousPage: false,
              }),
              edges: () =>
                CatListFixture.map((c) => ({
                  cursor: `Cursor: ${c.id}`,
                  node: c,
                })),
            });
          },
        }),
        ext.RelayConnectionFieldMethod,
      ],
      outputs: false,
    });
  });
});

describe("dynamicInputMethod", () => {
  it("should provide a method on the input definition", async () => {
    makeSchema({
      types: [
        decorateType(GraphQLDateTime, {
          rootTyping: "Date",
        }),
        inputObjectType({
          name: "SomeInput",
          definition(t) {
            t.id("id");
            // @ts-ignore
            t.timestamps();
          },
        }),
        dynamicInputMethod({
          name: "timestamps",
          factory({ typeDef }) {
            typeDef.field("createdAt", { type: "DateTime" });
            typeDef.field("updatedAt", { type: "DateTime" });
          },
        }),
      ],
      outputs: {
        typegen: path.join(__dirname, "test-output.ts"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      shouldGenerateArtifacts: false,
    });
  });
});

describe("dynamicOutputProperty", () => {
  it("should provide a way for adding a chainable api on the output definition", async () => {
    makeSchema({
      types: [
        decorateType(GraphQLDateTime, {
          rootTyping: "Date",
        }),
        objectType({
          name: "DynamicPropObject",
          definition(t) {
            t.id("id");
            // @ts-ignore
            t.model.timestamps();
          },
        }),
        dynamicOutputProperty({
          name: "model",
          factory({ typeDef }) {
            return {
              timestamps() {
                typeDef.field("createdAt", { type: "DateTime" });
                typeDef.field("updatedAt", { type: "DateTime" });
              },
            };
          },
        }),
      ],
      outputs: {
        typegen: path.join(__dirname, "test-output.ts"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      shouldGenerateArtifacts: false,
    });
  });
});
