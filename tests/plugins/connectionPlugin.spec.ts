import _ from "lodash";
import { connectionPlugin, makeSchema, objectType } from "../../src";

const User = objectType({
  name: "User",
  definition(t) {
    t.id("id");
    t.string("name");
  },
});

describe("connectionPlugin", () => {
  it("should adhere to the Relay spec", () => {
    makeSchema({
      types: [
        User,
        objectType({
          name: "Query",
          definition(t) {
            // @ts-ignore
            t.connectionField("users", {
              type: "User",
              nodes(root, args, ctx, info) {
                return [
                  { id: "User:1", name: "Test 1" },
                  { id: "User:2", name: "Test 2" },
                ];
              },
            });
          },
        }),
      ],
      plugins: [
        connectionPlugin({
          extendConnection: {
            totalCount: {
              type: "Int",
            },
          },
        }),
      ],
    });
  });
});
