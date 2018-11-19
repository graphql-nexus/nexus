/// <reference types="jest" />
import { GraphQLEnumType, GraphQLObjectType } from "graphql";
import { buildTypes, objectType, enumType } from "../";

describe("gqlit", () => {
  describe("enumType", () => {
    const PrimaryColors = enumType<any>("PrimaryColors", (t) => {
      t.members(["RED", "YELLOW", "BLUE"]);
    });

    const RainbowColors = enumType<any>("RainbowColors", (t) => {
      t.mix("PrimaryColors");
      t.members(["ORANGE", "GREEN", "VIOLET"]);
    });

    const AdditivePrimaryColors = enumType<any>(
      "AdditivePrimaryColors",
      (t) => {
        t.mix("PrimaryColors", { omit: ["YELLOW"] });
        t.members(["GREEN"]);
      }
    );

    const CircularRefTestA = enumType<any>("CircularA", (t) => {
      t.mix("CircularB");
      t.members(["A"]);
    });

    const CircularRefTestB = enumType<any>("CircularB", (t) => {
      t.mix("CircularA");
      t.members(["B"]);
    });

    it("builds an enum", () => {
      const types = buildTypes<{ PrimaryColors: GraphQLEnumType }>([
        PrimaryColors,
      ]);
      expect(types.typeMap.PrimaryColors).toBeInstanceOf(GraphQLEnumType);
      expect(
        types.typeMap.PrimaryColors.getValues().map((v) => v.value)
      ).toEqual(["RED", "YELLOW", "BLUE"]);
    });

    it("can mix enums", () => {
      const types = buildTypes<{ RainbowColors: GraphQLEnumType }>([
        PrimaryColors,
        RainbowColors,
      ]);
      expect(types.typeMap.RainbowColors).toBeInstanceOf(GraphQLEnumType);
      expect(
        types.typeMap.RainbowColors.getValues().map((v) => v.value)
      ).toEqual(["RED", "YELLOW", "BLUE", "ORANGE", "GREEN", "VIOLET"]);
    });

    it("can omit with mix", () => {
      const types = buildTypes<{
        AdditivePrimaryColors: GraphQLEnumType;
      }>([PrimaryColors, AdditivePrimaryColors]);
      expect(types.typeMap.AdditivePrimaryColors).toBeInstanceOf(
        GraphQLEnumType
      );
      expect(
        types.typeMap.AdditivePrimaryColors.getValues().map((v) => v.value)
      ).toEqual(["RED", "BLUE", "GREEN"]);
    });

    it("can pick with mix", () => {
      const FavoriteColors = enumType<any>("FavoriteColors", (t) => {
        t.mix("RainbowColors", { pick: ["RED", "GREEN"] });
      });
      const types = buildTypes<{ FavoriteColors: GraphQLEnumType }>([
        PrimaryColors,
        RainbowColors,
        FavoriteColors,
      ]);
      expect(types.typeMap.FavoriteColors).toBeInstanceOf(GraphQLEnumType);
      expect(
        types.typeMap.FavoriteColors.getValues().map((v) => v.value)
      ).toEqual(["RED", "GREEN"]);
    });

    it("can map internal values", () => {
      const Internal = enumType("Internal", (t) => {
        t.members([
          { name: "A", value: "--A--" },
          { name: "B", value: "--B--" },
        ]);
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

    it("has shorthand syntax for enum mapping", () => {
      const MappedArr = enumType("MappedArr", ["A", "B"]);
      const MappedObj = enumType("MappedObj", {
        a: 1,
        b: 2,
      });
      const types = buildTypes<{
        MappedObj: GraphQLEnumType;
        MappedArr: GraphQLEnumType;
      }>([MappedObj, MappedArr]);
      expect(types.typeMap.MappedArr.getValues().map((v) => v.name)).toEqual([
        "A",
        "B",
      ]);
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
      const NoMembers = enumType("NoMembers", () => {});
      expect(() => {
        const types = buildTypes<{ NoMembers: GraphQLEnumType }>([NoMembers]);
        expect(types.typeMap.NoMembers.getValues()).toHaveLength(0);
      }).toThrow("must have at least one member");
    });

    it("throws when building with a circular reference", () => {
      expect(() => {
        buildTypes([CircularRefTestA, CircularRefTestB]);
      }).toThrowError(
        "GQLiteral: Circular dependency detected, while building types"
      );
    });
  });

  describe("objectType", () => {
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
