import path from "path";
import { GraphQLDateTime } from "graphql-iso-date";
import {
  makeSchema,
  objectType,
  queryType,
  deferred,
  inputObjectType,
  dynamicInputMethod,
  decorateType,
} from "../src/core";
import { RelayConnectionMethod, CollectionMethod } from "../src/extensions";
import { FileSystem } from "../src/fileSystem";
import { graphql } from "graphql";
import { CatListFixture } from "./_fixtures";
import { dynamicOutputProperty } from "../src/dynamicProperty";

let spy: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  spy = jest
    .spyOn(FileSystem.prototype, "replaceFile")
    .mockImplementation(async () => null);
});

describe("dynamicOutputMethod", () => {
  const Cat = objectType({
    name: "Cat",
    definition(t) {
      t.id("id");
      t.string("name");
    },
  });

  test("RelayConnectionMethod example", async () => {
    const dfd = deferred();
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
      types: [Query, RelayConnectionMethod],
      outputs: {
        typegen: path.join(__dirname, "test-output.ts"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      shouldGenerateArtifacts: true,
      onReady: dfd.resolve,
    });
    await dfd.promise;
    expect(spy.mock.calls[0]).toMatchSnapshot();
    expect(spy.mock.calls[1]).toMatchSnapshot();
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

  test("CollectionMethod example", async () => {
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

    const dfd = deferred();

    const schema = makeSchema({
      types: [dynamicOutputMethod, CollectionMethod],
      outputs: {
        typegen: path.join(__dirname, "test-output"),
        schema: path.join(__dirname, "schema.graphql"),
      },
      onReady: dfd.resolve,
      shouldGenerateArtifacts: true,
    });

    await dfd.promise;
    expect(spy.mock.calls[0]).toMatchSnapshot();
    expect(spy.mock.calls[1]).toMatchSnapshot();

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

  test("CollectionMethod example with string type ref", () => {
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
        CollectionMethod,
      ],
      outputs: false,
    });
  });

  test("RelayConnectionMethod example with string type ref", async () => {
    makeSchema({
      types: [
        queryType({
          definition(t) {
            // @ts-ignore
            t.relayConnectionField("cats", {
              type: "Cat",
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
        RelayConnectionMethod,
      ],
      outputs: false,
    });
  });
});

describe("dynamicInputMethod", () => {
  it("should provide a method on the input definition", async () => {
    const dfd = deferred();
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
      onReady: dfd.resolve,
      shouldGenerateArtifacts: true,
    });
    await dfd.promise;
    expect(spy.mock.calls[0]).toMatchSnapshot();
    expect(spy.mock.calls[1]).toMatchSnapshot();
  });
});

describe("dynamicOutputProperty", () => {
  it("should provide a way for adding a chainable api on the output definition", async () => {
    const dfd = deferred();
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
      onReady: dfd.resolve,
      shouldGenerateArtifacts: true,
    });
    await dfd.promise;
    expect(spy.mock.calls[0]).toMatchSnapshot();
    expect(spy.mock.calls[1]).toMatchSnapshot();
  });
});
