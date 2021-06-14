import { executeSync, parse } from 'graphql'
import { connectionPlugin, makeSchema, objectType } from '../../src'
import type { SchemaConfig } from '../../src/core'
import type { ConnectionFieldConfig, ConnectionPluginConfig } from '../../src/plugins/connectionPlugin'

const userNodes: { id: string; name: string }[] = []
for (let i = 0; i < 10; i++) {
  userNodes.push({ id: `User:${i + 1}`, name: `Test ${i + 1}` })
}

const User = objectType({
  name: 'User',
  definition(t) {
    t.id('id')
    t.string('name')
  },
})

const UsersFieldBody = `
  nodes { id }
  edges { 
    cursor
    node { id } 
  }
  pageInfo {
    hasNextPage
    hasPreviousPage
    startCursor
    endCursor
  }
`

const UsersFirst = parse(`query UsersFieldFirst($first: Int!) { users(first: $first) { ${UsersFieldBody} } }`)

const makeTestSchema = (
  pluginConfig: ConnectionPluginConfig = {},
  fieldConfig: Omit<ConnectionFieldConfig<any, any>, 'type'> = {},
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {}
) =>
  makeSchema({
    outputs: false,
    types: [
      User,
      objectType({
        name: 'Query',
        definition(t) {
          // @ts-ignore
          t.connectionField('users', {
            type: User,
            nodes(root: any, args: any, ctx: any, info: any) {
              return userNodes
            },
            ...fieldConfig,
          })
        },
      }),
    ],
    nonNullDefaults: {
      input: false,
      output: false,
    },
    ...makeSchemaConfig,
    plugins: [connectionPlugin(pluginConfig), ...(makeSchemaConfig.plugins ?? [])],
  })

beforeEach(() => {
  jest.resetAllMocks()
})

describe('field level configuration', () => {
  it('does not pay the cost of async unless there is an async call', () => {
    const schema = makeTestSchema()

    const result = executeSync({
      schema,
      document: UsersFirst,
      variableValues: {
        first: 1,
      },
    })
    expect(result).toMatchSnapshot()
  })
})
