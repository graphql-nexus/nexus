import { makeSchema, subscriptionField } from "../src/core";

describe("subscriptionField", () => {
  it("defines a field on the mutation type as shorthand", () => {
    makeSchema({
      types: [
        subscriptionField("someField", {
          type: "String",
          async subscribe() {
            let val = 0;
            return {
              next() {
                return `Num:${val++}`;
              },
            };
          },
          resolve: () => "Hello World",
        }),
      ],
      outputs: false,
    });
  });
  it("can be defined as a thunk", () => {
    makeSchema({
      types: [
        subscriptionField("someField", () => ({
          type: "String",
          async subscribe() {
            let val = 0;
            return {
              next() {
                return `Num:${val++}`;
              },
            };
          },
          resolve: () => "Hello World",
        })),
      ],
      outputs: false,
    });
  });
});
