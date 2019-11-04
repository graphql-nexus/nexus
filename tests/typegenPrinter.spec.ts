import {
  buildSchema,
  GraphQLField,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from "graphql";
import * as path from "path";
import { core } from "../src";
import { EXAMPLE_SDL } from "./_sdl";
const { makeSchema, TypegenPrinter, TypegenMetadata } = core;

describe("typegenPrinter", () => {
  let typegen: core.TypegenPrinter;
  let metadata: core.TypegenMetadata;
  beforeEach(async () => {
    const schema = makeSchema({
      types: [buildSchema(EXAMPLE_SDL)],
    }) as core.NexusGraphQLSchema;
    metadata = new TypegenMetadata({
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
    });
    const typegenInfo = await metadata.getTypegenInfo(schema);
    typegen = new TypegenPrinter(metadata.sortSchema(schema), {
      ...typegenInfo,
      typegenFile: "",
    });
    jest
      .spyOn(typegen, "hasResolver")
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
      .spyOn(typegen, "hasResolver")
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
