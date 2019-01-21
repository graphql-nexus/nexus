import { extendType, buildTypes, idArg } from "../src";
import { UserObject, InputObject } from "./_helpers";

describe("extendType", () => {
  it("should allow adding types to the Query type", () => {
    const GetUser = extendType("Query", (t) => {
      t.field("user", UserObject, { args: { id: idArg() } });
    });
    const GetAccount = extendType("Query", (t) => {
      t.field("account");
    });
    buildTypes([GetUser]);
  });

  it("should allow adding types to the Mutation type", () => {
    const AddUser = extendType("Mutation", (t) => {});
  });

  it("should error if the type is extended but not defined", () => {
    //
  });
});
