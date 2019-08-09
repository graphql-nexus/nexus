import { objectType } from "../../src";

export const query = objectType({
  name: "Query",
  definition(t) {
    t.string("foo", () => "bar");
  },
});
