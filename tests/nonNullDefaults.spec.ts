import { makeSchema, queryType, intArg, core } from "../src";
import { printSchema } from "graphql";

describe("nonNullDefaults", () => {
  test("true/true on schema", () => {
    const schema = makeSchema({
      types: [makeQuery()],
      outputs: false,
      nonNullDefaults: {
        input: true,
        output: true,
      },
    });
    expect(printSchema(schema)).toMatchInlineSnapshot(`
"type Query {
  test(test: Int!): Boolean!
}
"
`);
  });
  test("true/true on type", () => {
    const schema = makeSchema({
      types: [makeQuery({ nonNullDefaults: { input: true, output: true } })],
      outputs: false,
    });
    expect(printSchema(schema)).toMatchInlineSnapshot(`
"type Query {
  test(test: Int!): Boolean!
}
"
`);
  });
  test("false/false on schema", () => {
    const schema = makeSchema({
      types: [makeQuery()],
      outputs: false,
      nonNullDefaults: {
        input: false,
        output: false,
      },
    });
    expect(printSchema(schema)).toMatchInlineSnapshot(`
"type Query {
  test(test: Int): Boolean
}
"
`);
  });
  test("false/false on type", () => {
    const schema = makeSchema({
      types: [makeQuery({ nonNullDefaults: { input: false, output: false } })],
      outputs: false,
    });
    expect(printSchema(schema)).toMatchInlineSnapshot(`
"type Query {
  test(test: Int): Boolean
}
"
`);
  });
});

function makeQuery(config?: Partial<core.NexusObjectTypeConfig<string>>) {
  return queryType({
    ...config,
    definition(t) {
      t.boolean("test", {
        args: {
          test: intArg(),
        },
      });
    },
  });
}
