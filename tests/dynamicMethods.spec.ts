import path from "path";
import { makeSchema, objectType, queryType, deferred } from "../src/core";
import { RelayConnectionMethod, CollectionMethod } from "../src/extensions";
import { FileSystem } from "../src/fileSystem";
import { graphql } from "graphql";
import { CatListFixture } from "./_fixtures";

describe("nexus: dynamicOutputMethod", () => {
  const Cat = objectType({
    name: "Cat",
    definition(t) {
      t.id("id");
      t.string("name");
    },
  });

  let spy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest
      .spyOn(FileSystem.prototype, "replaceFile")
      .mockImplementation(async () => null);
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
