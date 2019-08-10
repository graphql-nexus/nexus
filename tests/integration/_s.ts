import {
  objectType,
  idArg,
  queryType,
  mutationType,
  stringArg,
} from "../../src";

export const user = objectType({
  name: "User",
  definition(t) {
    t.string("firstName");
    t.string("lastName");
  },
});

export const query = queryType({
  definition(t) {
    t.field("user", {
      type: "User",
      args: { id: idArg() },
      resolve: (_root) => ({ firstName: "", lastName: "" }),
    });
  },
});

export const mutation = mutationType({
  definition(t) {
    t.field("createUser", {
      type: "User",
      args: { firstName: stringArg(), lastName: stringArg() },
      resolve: (_root) => ({ firstName: "", lastName: "" }),
    });
  },
});
