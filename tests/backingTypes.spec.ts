import path from "path";
import { core, queryType, enumType } from "../src";
import { A, B } from "./_types";
import { makeSchemaInternal } from "../src/core";

const { TypegenPrinter, TypegenMetadata } = core;

export enum TestEnum {
  A = "a",
  B = "b",
}

function getSchemaWithNormalEnums() {
  return makeSchemaInternal({
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
  return core.makeSchemaInternal({
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
    const { builder, schema } = core.makeSchemaInternal({
      types: [],
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
    metadata = new TypegenMetadata(builder, schema);
  });

  it("can match backing types to regular enums", async () => {
    const { schema, builder } = getSchemaWithNormalEnums();
    const metadata = new TypegenMetadata(builder, schema);
    const typegen = new TypegenPrinter(
      metadata,
      await metadata.getTypegenInfo()
    );

    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  A: \\"ONE\\" | \\"TWO\\"
}"
`);
  });

  it("can match backing types for const enums", async () => {
    const { schema, builder } = getSchemaWithConstEnums();
    const metadata = new TypegenMetadata(builder, schema);
    const typegen = new TypegenPrinter(
      metadata,
      await metadata.getTypegenInfo()
    );
    expect(typegen.printEnumTypeMap()).toMatchInlineSnapshot(`
"export interface NexusGenEnums {
  B: \\"9\\" | \\"10\\"
}"
`);
  });
});

describe("rootTypings", () => {
  it("can import enum via rootTyping", async () => {
    const { schema, builder } = makeSchemaInternal({
      types: [
        enumType({
          name: "TestEnumType",
          members: TestEnum,
          rootTyping: {
            path: __filename,
            name: "TestEnum",
          },
        }),
      ],
      outputs: false,
    });
    const metadata = new TypegenMetadata(builder, schema);
    const typegen = new TypegenPrinter(
      metadata,
      await metadata.getTypegenInfo()
    );
    expect(typegen.print()).toMatchSnapshot();
  });
});
