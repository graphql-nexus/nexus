import { connectionPlugin, makeSchema, objectType } from "../../src";

const User = objectType({
  name: "User",
  definition(t) {
    t.id("name");
    t.string("name");
  },
});

describe("connectionPlugin", () => {
  it("should adhere to the Relay spec by default", () => {
    makeSchema({
      types: [
        User,
        objectType({
          name: "Query",
          definition(t) {
            // @ts-ignore
            t.connectionField("users", {
              type: "User",
              nodes() {
                return [];
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
