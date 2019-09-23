import { makeSchema, queryField } from "../src/core";

describe("queryField", () => {
  it("defines a field on the query type as shorthand", () => {
    makeSchema({
      types: [
        queryField("someField", {
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
        queryField("someField", () => ({
          type: "String",
          resolve: () => "Hello World",
        })),
      ],
      outputs: false,
    });
  });
});