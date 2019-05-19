import path from "path";
import { core, makeSchema, queryType, enumType } from "../src";
import { A, B } from "./_types";

const { Typegen, TypegenMetadata } = core;

function getSchemaWithNormalEnums() {
  return makeSchema({
    types: [
      enumType({
        name: "A",
        members: [A.ONE, A.TWO],
      }),
      queryType({
        definition(t) {
          t.field("a", { type: "A" });
        },
      }),
    ],
    outputs: false,
  });
}

function getSchemaWithConstEnums() {
  return makeSchema({
    types: [
      enumType({
        name: "B",
        members: [B.NINE, B.TEN],
      }),
      queryType({
        definition(t) {
          t.field("b", { type: "B" });
        },
      }),
    ],
    outputs: false,
  });
}

describe("backingTypes", () => {
  let metadata: core.TypegenMetadata;

  beforeEach(async () => {
    metadata = new TypegenMetadata({
      outputs: {
        typegen: path.join(__dirname, "test-gen.ts"),
        schema: path.join(__dirname, "test-gen.graphql"),
      },
      typegenAutoConfig: {
        sources: [
          {
            alias: "t",
            source: path.join(__dirname, "_types.ts"),
          },
        ],
        contextType: "t.TestContext",
      },
    });
  });

  it("can match backing types to regular enums", async () => {
    const schema = getSchemaWithNormalEnums();
    const typegenInfo = await metadata.getTypegenInfo(schema);
    const typegen = new Typegen(schema, typegenInfo);

    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  A: t.A
}"
`);
  });

  it("can match backing types for const enums", async () => {
    const schema = getSchemaWithConstEnums();
    const typegenInfo = await metadata.getTypegenInfo(schema);
    const typegen = new Typegen(schema, typegenInfo);

    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  B: t.B
}"
`);
  });
});
