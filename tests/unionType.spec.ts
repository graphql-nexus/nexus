import { graphql } from "graphql";
import path from "path";
import {
  deferred,
  makeSchema,
  objectType,
  queryField,
  unionType,
} from "../src/core";
import { FileSystem } from "../src/fileSystem";

describe("unionType", () => {
  let spy: jest.SpyInstance;
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest
      .spyOn(FileSystem.prototype, "replaceFile")
      .mockImplementation(async () => null);
  });

  test("unionType", async () => {
    const dfd = deferred();
    const schema = makeSchema({
      types: [
        objectType({
          name: "DeletedUser",
          definition(t) {
            t.string("message", (root) => `This user ${root.id} was deleted`);
          },
          rootTyping: `{ id: number; deletedAt: Date }`,
        }),
        objectType({
          name: "User",
          definition(t) {
            t.int("id");
            t.string("name");
          },
          rootTyping: `{ id: number; name: string; deletedAt?: null }`,
        }),
        unionType({
          name: "UserOrError",
          definition(t) {
            t.members("User", "DeletedUser");
            t.resolveType((o) => (o.deletedAt ? "DeletedUser" : "User"));
          },
        }),
        queryField("userTest", {
          type: "UserOrError",
          resolve: () => ({ id: 1, name: "Test User" }),
        }),
        queryField("deletedUserTest", {
          type: "UserOrError",
          resolve: () => ({
            id: 1,
            name: "Test User",
            deletedAt: new Date("2019-01-01"),
          }),
        }),
      ],
      onReady: dfd.resolve,
      outputs: {
        schema: path.join(__dirname, "unionTypeTest.graphql"),
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
          fragment UserOrErrorFields on UserOrError {
            __typename
            ... on User {
              id
              name
            }
            ... on DeletedUser {
              message
            }
          }
          query UserOrErrorTest {
            userTest {
              ...UserOrErrorFields
            }
            deletedUserTest {
              ...UserOrErrorFields
            }
          }
        `
      )
    ).toMatchSnapshot();
  });
});
