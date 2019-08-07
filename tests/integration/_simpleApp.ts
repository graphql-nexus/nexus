import { join } from "path";
import { makeSchema, objectType } from "../../src";

const query = objectType({
  name: "Query",
  definition(t) {
    t.string("foo", () => "bar");
  },
});

makeSchema({
  types: [query],
  outputs: {
    typegen: join(__dirname, "./_simpleApp.d.ts"),
    schema: false,
  },
});
