import { GraphQLObjectType, GraphQLNonNull, GraphQLID, graphql } from "graphql";
import {
  objectType,
  queryField,
  nullabilityGuardPlugin,
  makeSchema,
  NullabilityGuardConfig,
} from "../../src";

describe("nullabilityGuardPlugin", () => {
  const onGuardedMock = jest.fn();

  afterEach(() => {
    jest.resetAllMocks();
  });

  const nullPlugin = (config: NullabilityGuardConfig = {}) =>
    nullabilityGuardPlugin({
      onGuarded: onGuardedMock,
      fallbackValues: {
        ID: ({ info }) => `${info.parentType.name}:N/A`,
        Int: () => -1,
        String: () => "",
        Boolean: () => false,
      },
      shouldGuard: true,
      ...config,
    });

  const types = [
    new GraphQLObjectType({
      name: "SomeObjectType",
      description:
        "Showing that the defaults works for all resolvers, not just Nexus ones",
      fields: () => ({
        id: {
          type: GraphQLNonNull(GraphQLID),
        },
      }),
    }),
    objectType({
      name: "User",
      definition(t) {
        t.id("id");
        t.list.field("usersList", {
          type: "User",
          // @ts-ignore
          skipNullGuard: true,
          resolve: () => {
            return [{ id: `A:1` }, { id: `B:2` }];
          },
        });
      },
      rootTyping: "{ id: string }",
    }),
    queryField("objType", {
      type: "SomeObjectType" as any,
      resolve: () => ({} as any),
    }),
    queryField("getUser", {
      type: "User",
      resolve: () => ({
        id: "User: 1",
      }),
    }),
    queryField("getUserWithGuard", {
      type: "User",
      resolve: () => ({
        id: null as any,
      }),
    }),
    queryField("intList", {
      type: "Int",
      list: true,
      resolve: () => [1, 2, null],
    }),
    queryField("userList", {
      type: "User",
      list: true,
      resolve: () => [null, null, null],
    }),
  ];

  const defaultSchema = makeSchema({
    types,
    plugins: [nullPlugin()],
  });

  it("should trigger the nullability guard", async () => {
    const { errors = [], data } = await graphql(
      defaultSchema,
      `
        {
          getUserWithGuard {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.getUserWithGuard).toEqual({ id: "User:N/A" });
    expect(onGuardedMock).toBeCalledTimes(1);
  });

  it("should fill ints with a default", async () => {
    const { errors = [], data } = await graphql(
      defaultSchema,
      `
        {
          intList
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.intList).toEqual([1, 2, -1]);
    expect(onGuardedMock).toBeCalledTimes(1);
  });

  it("should fill with defaults", async () => {
    const { errors = [], data } = await graphql(
      defaultSchema,
      `
        {
          userList {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.userList).toEqual([
      { id: "User:N/A" },
      { id: "User:N/A" },
      { id: "User:N/A" },
    ]);
    // Once for each null, once for each "id" field
    expect(onGuardedMock).toBeCalledTimes(6);
  });

  it("should guard on GraphQLObjectType fields", async () => {
    const { errors = [], data } = await graphql(
      defaultSchema,
      `
        {
          objType {
            id
          }
        }
      `
    );
    expect(errors).toEqual([]);
    expect(data.objType).toEqual({ id: "SomeObjectType:N/A" });
    expect(onGuardedMock).toBeCalledTimes(1);
  });

  it("should warn by default if onGuarded is not provided", () => {
    //
  });
});
