import { printSchema } from 'graphql'
import { core, intArg, makeSchema, queryType } from '../src'

describe('nonNullDefaults', () => {
  test('true/true on schema', () => {
    const schema = makeSchema({
      types: [makeQuery()],
      outputs: false,
      nonNullDefaults: {
        input: true,
        output: true,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })
  test('true/true on type', () => {
    const schema = makeSchema({
      types: [makeQuery({ nonNullDefaults: { input: true, output: true } })],
      outputs: false,
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })
  test('false/false on schema', () => {
    const schema = makeSchema({
      types: [makeQuery()],
      outputs: false,
      nonNullDefaults: {
        input: false,
        output: false,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })
  test('false/false on type', () => {
    const schema = makeSchema({
      types: [makeQuery({ nonNullDefaults: { input: false, output: false } })],
      outputs: false,
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })
})

function makeQuery(config?: Partial<core.NexusObjectTypeConfig<string>>) {
  return queryType({
    ...config,
    definition(t) {
      t.boolean('test', {
        args: {
          test: intArg(),
        },
      })
      t.list.field('stringList', {
        type: 'String',
      })
    },
  })
}
