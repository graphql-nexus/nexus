/// <reference types="jest" />
import {
  gqlitBuildTypes,
  GQLiteralEnum,
  GQLiteralObject,
} from "../definitions";
import { GraphQLEnumType, GraphQLObjectType } from "graphql";

describe("gqlit", () => {
  describe("GQLiteralEnum", () => {
    const PrimaryColors = GQLiteralEnum("PrimaryColors", t => {
      t.member({ value: "RED" });
      t.member({ value: "YELLOW" });
      t.member({ value: "BLUE" });
    });

    const RainbowColors = GQLiteralEnum("RainbowColors", t => {
      t.mix("PrimaryColors");
      t.member({ value: "ORANGE" });
      t.member({ value: "GREEN" });
      t.member({ value: "VIOLET" });
    });

    const AdditivePrimaryColors = GQLiteralEnum("AdditivePrimaryColors", t => {
      t.mix("PrimaryColors", { omit: ["YELLOW"] });
      t.member({ value: "GREEN" });
    });

    const CircularRefTestA = GQLiteralEnum("CircularA", t => {
      t.mix("CircularB");
      t.member({ value: "A" });
    });

    const CircularRefTestB = GQLiteralEnum("CircularA", t => {
      t.mix("CircularA");
      t.member({ value: "B" });
    });

    it("builds an enum", () => {
      const types: { PrimaryColors: GraphQLEnumType } = gqlitBuildTypes([
        PrimaryColors,
      ]) as any;
      expect(types.PrimaryColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.PrimaryColors.getValues().map(v => v.value)).toEqual([
        "RED",
        "YELLOW",
        "BLUE",
      ]);
    });

    it("can mix enums", () => {
      const types: { RainbowColors: GraphQLEnumType } = gqlitBuildTypes([
        PrimaryColors,
        RainbowColors,
      ]) as any;
      expect(types.RainbowColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.RainbowColors.getValues().map(v => v.value)).toEqual([
        "RED",
        "YELLOW",
        "BLUE",
        "ORANGE",
        "GREEN",
        "VIOLET",
      ]);
    });

    it("can omit with mix", () => {
      const types: { AdditivePrimaryColors: GraphQLEnumType } = gqlitBuildTypes(
        [PrimaryColors, AdditivePrimaryColors]
      ) as any;
      expect(types.AdditivePrimaryColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.AdditivePrimaryColors.getValues().map(v => v.value)).toEqual(
        ["RED", "BLUE", "GREEN"]
      );
    });

    it("can pick with mix", () => {
      const FavoriteColors = GQLiteralEnum("FavoriteColors", t => {
        t.mix("RainbowColors", { pick: ["RED", "GREEN"] });
      });
      const types: { FavoriteColors: GraphQLEnumType } = gqlitBuildTypes([
        PrimaryColors,
        RainbowColors,
        FavoriteColors,
      ]) as any;
      expect(types.FavoriteColors).toBeInstanceOf(GraphQLEnumType);
      expect(types.FavoriteColors.getValues().map(v => v.value)).toEqual([
        "RED",
        "GREEN",
      ]);
    });

    it("can map internal values", () => {
      const Internal = GQLiteralEnum("Internal", t => {
        t.member({ value: "A", internalValue: "--A--" });
        t.member({ value: "B", internalValue: "--B--" });
      });
      const types: { Internal: GraphQLEnumType } = gqlitBuildTypes([
        Internal,
      ]) as any;
      expect(types.Internal.getValues().map(v => v.name)).toEqual(["A", "B"]);
      expect(types.Internal.getValues().map(v => v.value)).toEqual([
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
      } = gqlitBuildTypes([MappedObj, MappedArr]) as any;
      expect(types.MappedArr.getValues().map(v => v.name)).toEqual(["A", "B"]);
      expect(types.MappedObj.getValues().map(v => v.name)).toEqual(["a", "b"]);
      expect(types.MappedObj.getValues().map(v => v.value)).toEqual([1, 2]);
    });

    it("throws if the enum has no members", () => {
      const NoMembers = GQLiteralEnum("NoMembers", () => {});
      expect(() => {
        const types: { NoMembers: GraphQLEnumType } = gqlitBuildTypes([
          NoMembers,
        ]) as any;
        expect(types.NoMembers.getValues()).toHaveLength(0);
      }).toThrow("must have at least one member");
    });

    it("throws when building with a circular reference", () => {
      expect(() => {
        gqlitBuildTypes([CircularRefTestA, CircularRefTestB]);
      }).toThrowError(
        "Circular dependency mixin detected when building GQLit Enum"
      );
    });
  });

  describe("GQLiteralObject", () => {
    const Account = GQLiteralObject("Account", t => {
      t.id("id", { description: "The ID of the account" });
      t.string("name", { description: "Holder of the account" });
      t.string("email", {
        description: "The email of the person whos account this is",
      });
    });
    const type: { Account: GraphQLObjectType } = gqlitBuildTypes([
      Account,
    ]) as any;
    expect(Object.keys(type.Account.getFields()).sort()).toEqual([
      "id",
      "email",
      "name",
    ]);
  });
});
