/// <reference types="jest" />
import { GQLiteralEnum, GQLiteralObject } from "../definitions";
import { GraphQLEnumType, GraphQLObjectType } from "graphql";
import { buildTypes } from "../utils";

describe("gqlit", () => {
  describe("GQLiteralEnum", () => {
    const PrimaryColors = GQLiteralEnum<any>("PrimaryColors", (t) => {
      t.members(["RED", "YELLOW", "BLUE"]);
    });

    const RainbowColors = GQLiteralEnum<any>("RainbowColors", (t) => {
      t.mix("PrimaryColors");
      t.members(["ORANGE", "GREEN", "VIOLET"]);
    });

    const AdditivePrimaryColors = GQLiteralEnum<any>(
      "AdditivePrimaryColors",
      (t) => {
        t.mix("PrimaryColors", { omit: ["YELLOW"] });
        t.members(["GREEN"]);
      }
    );

    const CircularRefTestA = GQLiteralEnum<any>("CircularA", (t) => {
      t.mix("CircularB");
      t.members(["A"]);
    });

    const CircularRefTestB = GQLiteralEnum<any>("CircularB", (t) => {
      t.mix("CircularA");
      t.members(["B"]);
    });

    it("builds an enum", () => {
      const types: { PrimaryColors: GraphQLEnumType } = buildTypes([
        PrimaryColors,
      ]) as any;
      expect(types.PrimaryColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.PrimaryColors.getValues().map((v) => v.value)).toEqual([
        "RED",
        "YELLOW",
        "BLUE",
      ]);
    });

    it("can mix enums", () => {
      const types: { RainbowColors: GraphQLEnumType } = buildTypes([
        PrimaryColors,
        RainbowColors,
      ]) as any;
      expect(types.RainbowColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.RainbowColors.getValues().map((v) => v.value)).toEqual([
        "RED",
        "YELLOW",
        "BLUE",
        "ORANGE",
        "GREEN",
        "VIOLET",
      ]);
    });

    it("can omit with mix", () => {
      const types: {
        AdditivePrimaryColors: GraphQLEnumType;
      } = buildTypes([PrimaryColors, AdditivePrimaryColors]) as any;
      expect(types.AdditivePrimaryColors).toBeInstanceOf(GraphQLEnumType);
      expect(
        types.AdditivePrimaryColors.getValues().map((v) => v.value)
      ).toEqual(["RED", "BLUE", "GREEN"]);
    });

    it("can pick with mix", () => {
      const FavoriteColors = GQLiteralEnum<any>("FavoriteColors", (t) => {
        t.mix("RainbowColors", { pick: ["RED", "GREEN"] });
      });
      const types: { FavoriteColors: GraphQLEnumType } = buildTypes([
        PrimaryColors,
        RainbowColors,
        FavoriteColors,
      ]) as any;
      expect(types.FavoriteColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.FavoriteColors.getValues().map((v) => v.value)).toEqual([
        "RED",
        "GREEN",
      ]);
    });

    it("can map internal values", () => {
      const Internal = GQLiteralEnum("Internal", (t) => {
        t.members([
          { name: "A", value: "--A--" },
          { name: "B", value: "--B--" },
        ]);
      });
      const types: { Internal: GraphQLEnumType } = buildTypes([
        Internal,
      ]) as any;
      expect(types.Internal.getValues().map((v) => v.name)).toEqual(["A", "B"]);
      expect(types.Internal.getValues().map((v) => v.value)).toEqual([
        "--A--",
        "--B--",
      ]);
    });

    it("has shorthand syntax for enum mapping", () => {
      const MappedArr = GQLiteralEnum("MappedArr", ["A", "B"]);
      const MappedObj = GQLiteralEnum("MappedObj", {
        a: 1,
        b: 2,
      });
      const types: {
        MappedObj: GraphQLEnumType;
        MappedArr: GraphQLEnumType;
      } = buildTypes([MappedObj, MappedArr]) as any;
      expect(types.MappedArr.getValues().map((v) => v.name)).toEqual([
        "A",
        "B",
      ]);
      expect(types.MappedObj.getValues().map((v) => v.name)).toEqual([
        "a",
        "b",
      ]);
      expect(types.MappedObj.getValues().map((v) => v.value)).toEqual([1, 2]);
    });

    it("throws if the enum has no members", () => {
      const NoMembers = GQLiteralEnum("NoMembers", () => {});
      expect(() => {
        const types: { NoMembers: GraphQLEnumType } = buildTypes([
          NoMembers,
        ]) as any;
        expect(types.NoMembers.getValues()).toHaveLength(0);
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

  describe("GQLiteralObject", () => {
    const Account = GQLiteralObject("Account", (t) => {
      t.id("id", { description: "The ID of the account" });
      t.string("name", { description: "Holder of the account" });
      t.string("email", {
        description: "The email of the person whos account this is",
      });
    });
    const type: { Account: GraphQLObjectType } = buildTypes([Account]) as any;
    expect(Object.keys(type.Account.getFields()).sort()).toEqual([
      "email",
      "id",
      "name",
    ]);
  });
});
