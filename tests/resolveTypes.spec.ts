import { graphql } from 'graphql'
import { makeSchema, queryType, scalarType } from "../src";

describe("custom scalars", () => {
  it("resolve custom scalar with inline functions", async () => {
    const now = new Date()
    const schema = makeSchema({
      types: [
        scalarType({
          name: "Date",
          asNexusMethod: "date",
          description: "Date custom scalar type",
          parseValue(value) {
            return new Date(value);
          },
          serialize(value) {
            return value.getTime();
          },
          parseLiteral(ast) {
            if (ast.kind === Kind.INT) {
              return new Date(ast.value);
            }
            return null;
          },
        }),
        queryType({
          definition(t) {
          t.date('testDate', () => now)
         }
        })
      ],
      outputs: false,
    });
    const query = `
      {
        testDate
      }
    `
    const { data: { testDate } } = await graphql(schema, query)
    expect(testDate).toBe(now.getTime())
  });
});
