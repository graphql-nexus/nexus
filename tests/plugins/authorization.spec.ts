import { makeSchema, queryField } from "../..";

describe("plugin: authorization", () => {
  it('adds an "authorize" property to the field definitions', () => {
    const schema = makeSchema({
      types: [
        queryField("someField", {
          type: "String",
          authorize: () => new Error("Not Authorized"),
        }),
      ],
    });
  });
});
