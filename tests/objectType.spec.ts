import { objectType, buildTypes } from "../src";
import { GraphQLObjectType } from "graphql";

describe("objectType", () => {
  it("should build an object type", () => {
    const Account = objectType("Account", (t) => {
      t.id("id", { description: "The ID of the account" });
      t.string("name", { description: "Holder of the account" });
      t.string("email", {
        description: "The email of the person whos account this is",
      });
    });
    const type = buildTypes<{ Account: GraphQLObjectType }>([Account]);
    expect(Object.keys(type.typeMap.Account.getFields()).sort()).toEqual([
      "email",
      "id",
      "name",
    ]);
  });
});
