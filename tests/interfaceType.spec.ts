import { graphql } from "graphql";
import path from "path";
import {
  deferred,
  interfaceType,
  makeSchema,
  objectType,
  queryField,
} from "../src/core";
import { FileSystem } from "../src/fileSystem";

describe("interfaceType", () => {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest
      .spyOn(FileSystem.prototype, "replaceFile")
      .mockImplementation(async () => null);
  });

  it("can be implemented by object types", async () => {
    const dfd = deferred();
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
      onReady: dfd.resolve,
      outputs: {
        schema: path.join(__dirname, "interfaceTypeTest.graphql"),
        typegen: false,
      },
      shouldGenerateArtifacts: true,
    });
    await dfd.promise;
    expect(spy).toBeCalledTimes(1);
    expect(spy.mock.calls[0]).toMatchSnapshot();
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
