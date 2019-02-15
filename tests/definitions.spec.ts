/// <reference types="jest" />
import {
  GraphQLEnumType,
  GraphQLObjectType,
  printType,
  GraphQLNamedType,
} from "graphql";
import {
  idArg,
  buildTypes,
  enumType,
  extendType,
  objectType,
  inputObjectType,
} from "../src";
import { UserObject, PostObject } from "./_helpers";
import { mapObj } from "../src/core";

describe("enumType", () => {
  const PrimaryColors = enumType({
    name: "PrimaryColors",
    members: ["RED", "YELLOW", "BLUE"],
  });

  it("builds an enum", () => {
    const types = buildTypes<{ PrimaryColors: GraphQLEnumType }>([
      PrimaryColors,
    ]);
    expect(types.typeMap.PrimaryColors).toBeInstanceOf(GraphQLEnumType);
    expect(types.typeMap.PrimaryColors.getValues().map((v) => v.value)).toEqual(
      ["RED", "YELLOW", "BLUE"]
    );
  });

  it("can map internal values", () => {
    const Internal = enumType({
      name: "Internal",
      members: [{ name: "A", value: "--A--" }, { name: "B", value: "--B--" }],
    });
    const types = buildTypes<{ Internal: GraphQLEnumType }>([Internal]);
    expect(types.typeMap.Internal.getValues().map((v) => v.name)).toEqual([
      "A",
      "B",
    ]);
    expect(types.typeMap.Internal.getValues().map((v) => v.value)).toEqual([
      "--A--",
      "--B--",
    ]);
  });

  it("has object syntax for enum mapping", () => {
    const MappedObj = enumType({
      name: "MappedObj",
      members: {
        a: 1,
        b: 2,
      },
    });
    const types = buildTypes<{
      MappedObj: GraphQLEnumType;
    }>([MappedObj]);
    expect(types.typeMap.MappedObj.getValues().map((v) => v.name)).toEqual([
      "a",
      "b",
    ]);
    expect(types.typeMap.MappedObj.getValues().map((v) => v.value)).toEqual([
      1,
      2,
    ]);
  });

  it("throws if the enum has no members", () => {
    expect(() => {
      const NoMembers = enumType({
        name: "NoMembers",
        members: [],
      });
      const types = buildTypes<{ NoMembers: GraphQLEnumType }>([NoMembers]);
      expect(types.typeMap.NoMembers.getValues()).toHaveLength(0);
    }).toThrow("must have at least one member");
  });
});

describe("objectType", () => {
  it("should build an object type", () => {
    const Account = objectType({
      name: "Account",
      definition(t) {
        t.id("id", { description: "The ID of the account" });
        t.string("name", { description: "Holder of the account" });
        t.string("email", {
          description: "The email of the person whos account this is",
        });
      },
    });
    const type = buildTypes<{ Account: GraphQLObjectType }>([Account]);
    expect(Object.keys(type.typeMap.Account.getFields()).sort()).toEqual([
      "email",
      "id",
      "name",
    ]);
  });
});

describe("extendType", () => {
  it("should allow adding types to the Query type", () => {
    const GetUser = extendType({
      type: "Query",
      definition(t) {
        t.field("user", { type: "User", args: { id: idArg() } });
      },
    });
    const GetPost = extendType({
      type: "Query",
      definition(t) {
        t.field("post", {
          type: PostObject,
        });
      },
    });
    expect(
      Object.keys(
        buildTypes<{ Query: GraphQLObjectType }>([
          GetUser,
          GetPost,
          PostObject,
          UserObject,
        ]).typeMap.Query.getFields()
      )
    ).toMatchInlineSnapshot(`
Array [
  "user",
  "post",
]
`);
  });
});

describe("inputObjectType", () => {
  it("should output lists properly, #33", () => {
    const buildTypesMap = buildTypes([
      inputObjectType({
        name: "ExtraBasketInput",
        definition(t) {
          t.string("foo");
        },
      }),
      inputObjectType({
        name: "AddToBasketInput",
        definition(t) {
          t.list.field("extras", { type: "ExtraBasketInput" });
        },
      }),
    ]);
    expect(printType(buildTypesMap.typeMap.AddToBasketInput))
      .toMatchInlineSnapshot(`
"input AddToBasketInput {
  extras: [ExtraBasketInput!]
}"
`);
  });
});
