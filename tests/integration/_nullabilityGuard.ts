import "./_nullabilityGuard.typegen";
import { plugins as nexusPlugins, objectType, queryField } from "../..";

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

export const plugins = [
  nexusPlugins.nullabilityGuard({
    onGuarded() {
      console.log(arguments);
    },
  }),
];
