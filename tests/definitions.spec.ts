/// <reference types="jest" />
import { GraphQLEnumType, GraphQLObjectType, printType } from "graphql";
import {
  idArg,
  buildTypes,
  enumType,
  extendType,
  objectType,
  inputObjectType,
  extendInputType,
} from "../src";
import { UserObject, PostObject } from "./_helpers";

enum NativeColors {
  RED = "RED",
  BLUE = "BLUE",
  GREEN = "green", // lower case to ensure we grab correct keys
}

enum NativeNumbers {
  ONE = 1,
  TWO = 2,
  THREE = 3,
}

describe("enumType", () => {
  it("builds an enum", () => {
    const PrimaryColors = enumType({
      name: "PrimaryColors",
      members: ["RED", "YELLOW", "BLUE"],
    });
    const types = buildTypes<{ PrimaryColors: GraphQLEnumType }>({
      types: [PrimaryColors],
      outputs: false,
    });
    expect(types.typeMap.PrimaryColors).toBeInstanceOf(GraphQLEnumType);
    expect(types.typeMap.PrimaryColors.getValues().map((v) => v.value)).toEqual(
      ["RED", "YELLOW", "BLUE"]
    );
  });

  it("builds an enum from a TypeScript enum with string values", () => {
    const Colors = enumType({
      name: "Colors",
      members: NativeColors,
    });
    const types = buildTypes<{ Colors: GraphQLEnumType }>({
      types: [Colors],
      outputs: false,
    });

    expect(types.typeMap.Colors).toBeInstanceOf(GraphQLEnumType);
    expect(types.typeMap.Colors.getValues()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "RED",
          value: "RED",
        }),
        expect.objectContaining({
          name: "BLUE",
          value: "BLUE",
        }),
        expect.objectContaining({
          name: "GREEN",
          value: "green",
        }),
      ])
    );
  });

  it("builds an enum from a TypeScript enum with number values", () => {
    const Numbers = enumType({
      name: "Numbers",
      members: NativeNumbers,
    });
    const types = buildTypes<{ Numbers: GraphQLEnumType }>({
      types: [Numbers],
      outputs: false,
    });

    expect(types.typeMap.Numbers).toBeInstanceOf(GraphQLEnumType);
    expect(types.typeMap.Numbers.getValues()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "ONE",
          value: 1,
        }),
        expect.objectContaining({
          name: "TWO",
          value: 2,
        }),
        expect.objectContaining({
          name: "THREE",
          value: 3,
        }),
      ])
    );
  });

  it("can map internal values", () => {
    const Internal = enumType({
      name: "Internal",
      members: [{ name: "A", value: "--A--" }, { name: "B", value: "--B--" }],
    });
    const types = buildTypes<{ Internal: GraphQLEnumType }>({
      types: [Internal],
      outputs: false,
    });
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
    }>({ types: [MappedObj], outputs: false });
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
      const types = buildTypes<{ NoMembers: GraphQLEnumType }>({
        types: [NoMembers],
        outputs: false,
      });
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
        t.string("nestedList", { list: [false, true] });
      },
    });
    const type = buildTypes<{ Account: GraphQLObjectType }>({
      types: [Account],
      outputs: false,
    });
    const fields = type.typeMap.Account.getFields();
    expect(Object.keys(fields).sort()).toEqual([
      "email",
      "id",
      "name",
      "nestedList",
    ]);
    expect(fields.nestedList.type.toString()).toEqual("[[String]!]!");
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
        buildTypes<{ Query: GraphQLObjectType }>({
          types: [GetUser, GetPost, PostObject, UserObject],
          outputs: false,
        }).typeMap.Query.getFields()
      )
    ).toMatchSnapshot();
  });
});

describe("inputObjectType", () => {
  it("should output lists properly, #33", () => {
    const buildTypesMap = buildTypes({
      types: [
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
      ],
      outputs: false,
    });
    expect(printType(buildTypesMap.typeMap.AddToBasketInput)).toMatchSnapshot();
  });
});

describe("extendInputType", () => {
  it("should allow extending input objects", () => {
    const buildTypesMap = buildTypes({
      types: [
        inputObjectType({
          name: "InputTest",
          definition(t) {
            t.string("hello");
          },
        }),
        extendInputType({
          type: "InputTest",
          definition(t) {
            t.string("world");
          },
        }),
      ],
      outputs: false,
    });
    expect(printType(buildTypesMap.typeMap.InputTest)).toMatchSnapshot();
  });
});
