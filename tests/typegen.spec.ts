import {
  buildSchema,
  lexicographicSortSchema,
  GraphQLField,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from "graphql";
import path from "path";
import { core } from "../src";
import { EXAMPLE_SDL } from "./_sdl";
import { makeSchemaInternal } from "../src/core";

const { TypegenMetadata, TypegenPrinter } = core;

describe("TypegenPrinter", () => {
  let metadata: core.TypegenMetadata;
  let typegen: core.TypegenPrinter;
  beforeEach(async () => {
    const schema = lexicographicSortSchema(buildSchema(EXAMPLE_SDL));
    const builder = makeSchemaInternal({
      outputs: {
        typegen: path.join(__dirname, "test-gen.ts"),
        schema: path.join(__dirname, "test-gen.graphql"),
      },
      typegenAutoConfig: {
        backingTypeMap: {
          UUID: "string",
        },
        sources: [
          {
            alias: "t",
            source: path.join(__dirname, "_helpers.ts"),
          },
        ],
        contextType: "t.TestContext",
      },
      types: schema.getTypeMap(),
    });
    jest
      .spyOn(TypegenPrinter.prototype, "hasResolver")
      .mockImplementation(
        (
          field: GraphQLField<any, any>,
          type: GraphQLObjectType | GraphQLInterfaceType
        ) => {
          if (type.name === "Query" || type.name === "Mutation") {
            return true;
          }
          return false;
        }
      );
    metadata = new TypegenMetadata(builder.builder, builder.schema);
    typegen = new TypegenPrinter(metadata, await metadata.getTypegenInfo());
  });

  it("builds the enum object type defs", () => {
    expect(typegen.printEnumTypeMap()).toMatchSnapshot();
  });

  it("builds the input object type defs", () => {
    expect(typegen.printInputTypeMap()).toMatchSnapshot();
  });

  it("should build an argument type map", () => {
    expect(typegen.printArgTypeMap()).toMatchSnapshot();
  });

  it("should print a root type map", () => {
    expect(typegen.printRootTypeMap()).toMatchSnapshot();
  });

  it("should not print roots for fields with resolvers", () => {
    // If we don't have a dedicated "root type", then we need to infer
    // what the return type should be based on the shape of the object
    // If the field has a resolver, we assume it's derived, otherwise
    // you'll need to supply a backing root type with more information.
    jest
      .clearAllMocks()
      .spyOn(TypegenPrinter.prototype, "hasResolver")
      .mockImplementation(
        (
          field: GraphQLField<any, any>,
          type: GraphQLObjectType | GraphQLInterfaceType
        ) => {
          if (type.name === "Query" || type.name === "Mutation") {
            return true;
          }
          if (type.name === "User" && field.name === "posts") {
            return true;
          }
          return false;
        }
      );
    expect(typegen.printRootTypeMap()).toMatchSnapshot();
  });

  it("should print a return type map", () => {
    expect(typegen.printReturnTypeMap()).toMatchSnapshot();
  });

  it("should print the full output", () => {
    expect(typegen.print()).toMatchSnapshot();
  });
});
