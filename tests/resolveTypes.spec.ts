import { graphql } from 'graphql'
import { makeSchema, queryType, scalarType } from '../src'

describe('custom scalars', () => {
  it('resolve custom scalar with inline functions', async () => {
    const now = new Date()
    const schema = makeSchema({
      types: [
        scalarType({
          name: 'Date',
          serialize: (value) => value.getTime(),
          parseValue: (value) => new Date(value),
          parseLiteral: (ast) => (ast.kind === 'IntValue' ? new Date(ast.value) : null),
          asNexusMethod: 'date',
          sourceType: 'Date',
        }),
        queryType({
          definition(t) {
            // @ts-ignore
            t.date('testDate', {
              resolve: () => now,
            })
          },
        }),
      ],
      outputs: false,
    })
    const query = `
      {
        testDate
      }
    `
    const result = await graphql(schema, query)
    expect(result.data!.testDate).toBe(now.getTime())
  })
})
