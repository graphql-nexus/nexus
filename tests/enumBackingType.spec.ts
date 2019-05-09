import { GraphQLField, GraphQLObjectType, GraphQLInterfaceType } from "graphql";
import path from "path";
import { core, makeSchema, queryType, enumType } from "../src";
import { Category } from "./_types";

const { Typegen, TypegenMetadata } = core;

function getSchema() {
  return [
    enumType({
      name: "Category",
      members: [Category.ONE, Category.TWO],
    }),
    queryType({
      definition(t) {
        t.field("categories", { type: "Category" });
      },
    }),
  ];
}

describe("enumBackingType", () => {
  let typegen: core.Typegen;
  let metadata: core.TypegenMetadata;
  beforeEach(async () => {
    const schema = makeSchema({
      types: [getSchema()],
      outputs: false,
    });
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
            source: path.join(__dirname, "_types.ts"),
          },
        ],
        contextType: "t.TestContext",
      },
    });
    const typegenInfo = await metadata.getTypegenInfo(schema);
    typegen = new Typegen(schema, typegenInfo);
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

  it("builds the enum object type defs with backing types", () => {
    console.log(typegen.printEnumTypeMap());

    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  Category: t.Category
}"
`);
  });
});
