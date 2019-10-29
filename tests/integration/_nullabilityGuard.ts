import graphql, { GraphQLObjectType, GraphQLNonNull, GraphQLID } from "graphql";
import "./_nullabilityGuard.typegen";
import { plugins as nexusPlugins, objectType, queryField } from "../../src";

export const SomeObjectType = new GraphQLObjectType({
  name: "SomeObjectType",
  description:
    "Showing that the defaults works for all resolvers, not just Nexus ones",
  fields: () => ({
    id: {
      type: GraphQLNonNull(GraphQLID),
    },
  }),
});

export const userType = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.list.field("usersList", {
      type: "User",
      skipNullGuard: true,
      resolve: () => {
        return [{ id: `A:1` }, { id: `B:2` }];
      },
    });
  },
  rootTyping: "{ id: string }",
});

export const objType = queryField("objType", {
  type: "SomeObjectType" as any,
  resolve: () => ({} as any),
});

export const userField = queryField("getUser", {
  type: "User",
  resolve: () => ({
    id: "User: 1",
  }),
});

export const guardedField = queryField("getUserWithGuard", {
  type: "User",
  resolve: () => ({
    id: null as any,
  }),
});

// @ts-ignore
export const guardedIntDefault = queryField("intList", {
  type: "Int",
  list: true,
  resolve: () => [1, 2, null],
});

// @ts-ignore
export const guardedUserList = queryField("userList", {
  type: "User",
  list: true,
  resolve: () => [null, null, null],
});

export const onGuardedMock = jest.fn();

export const plugins = [
  nexusPlugins.nullabilityGuard({
    onGuarded: onGuardedMock,
    fallbackValues: {
      ID: ({ info }) => `${info.parentType.name}:N/A`,
      Int: () => -1,
      String: () => "",
      Boolean: () => false,
    },
    shouldGuard: true,
  }),
];
