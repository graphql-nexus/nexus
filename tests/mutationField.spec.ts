import { makeSchema, mutationField } from "../src/core";

describe("mutationField", () => {
  it("defines a field on the mutation type as shorthand", () => {
    makeSchema({
      types: [
        mutationField("someField", {
          type: "String",
          resolve: () => "Hello World",
        }),
      ],
      outputs: false,
    });
  });
  it("can be defined as a thunk", () => {
    makeSchema({
      types: [
        mutationField("someField", () => ({
          type: "String",
          resolve: () => "Hello World",
        })),
      ],
      outputs: false,
    });
  });
});