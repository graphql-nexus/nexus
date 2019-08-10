import { queryType } from "../../src";

export const query = queryType({
  definition(t) {
    t.string("foo", () => "bar");
  },
});
