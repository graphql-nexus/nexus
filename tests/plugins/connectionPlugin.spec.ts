import {
  execute,
  ExecutionArgs,
  GraphQLError,
  GraphQLFieldResolver,
  GraphQLSchema,
  parse,
  printSchema,
  printType,
} from 'graphql'
import { connectionFromArray } from 'graphql-relay'
import { arg, connectionPlugin, makeSchema, nonNull, objectType } from '../../src'
import { generateSchema, SchemaConfig } from '../../src/core'
import { ConnectionFieldConfig, ConnectionPluginConfig } from '../../src/plugins/connectionPlugin'

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

const UsersLast = parse(`query UsersFieldLast($last: Int!) { users(last: $last) { ${UsersFieldBody} } }`)
const UsersLastBefore = parse(
  `query UsersFieldLastBefore($last: Int!, $before: String!) { users(last: $last, before: $before) { ${UsersFieldBody} } }`
)
const UsersFirst = parse(`query UsersFieldFirst($first: Int!) { users(first: $first) { ${UsersFieldBody} } }`)
const UsersFirstAfter = parse(
  `query UsersFieldFirstAfter($first: Int!, $after: String!) { users(first: $first, after: $after) { ${UsersFieldBody} } }`
)

const executeOk = async (args: ExecutionArgs) => {
  const result = await execute(args)
  expect(result.errors).toBeUndefined()
  return result
}

const customResolveFn: GraphQLFieldResolver<any, any> = (root: any, args: any) => {
  return connectionFromArray(userNodes, args)
}

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

describe('defaults', () => {
  it('hasPreviousPage when paginating backwards assumes that node count equal to page size means there is another page to visit backward', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes(root, args, ctx) {
          return userNodes.slice(0, 5)
        },
      }
    )
    const result = await executeOk({
      schema,
      document: UsersLastBefore,
      variableValues: {
        last: 5,
        before: 'whatever',
      },
    })
    expect(result.data?.users.pageInfo.hasPreviousPage).toEqual(true)
  })
  it('should provide forward pagination defaults', async () => {
    const schema = makeTestSchema({})
    const nodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 1 },
    })
    expect(nodes.data?.users.edges).toEqual([{ cursor: 'Y3Vyc29yOjA=', node: { id: 'User:1' } }])
    expect(Buffer.from(nodes.data?.users.edges[0].cursor, 'base64').toString('utf8')).toEqual('cursor:0')
  })
})

describe('basic behavior', () => {
  it('should adhere to the Relay spec', () => {
    const schema = makeTestSchema({})
    expect(printType(schema.getType('UserConnection')!)).toMatchSnapshot()
    expect(printType(schema.getType('UserEdge')!)).toMatchSnapshot()
    expect(printType(schema.getType('PageInfo')!)).toMatchSnapshot()
  })

  it('resolves string value', () => {
    const schema = makeTestSchema(
      {},
      {
        // @ts-ignore
        type: 'User',
      }
    )
    expect(schema.getType('UserConnection')).not.toBeUndefined()
    expect(schema.getType('UserEdge')).not.toBeUndefined()
    expect(schema.getType('PageInfo')).not.toBeUndefined()
  })

  it('should continue forward pagination from the after index', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes(root: any, args: any) {
          expect(args).toEqual({ first: 1, after: '0' })
          return userNodes
        },
      }
    )
    const nodes = await executeOk({
      schema,
      document: UsersFirstAfter,
      variableValues: { first: 1, after: 'Y3Vyc29yOjA=' },
    })
    expect(Buffer.from(nodes.data?.users.edges[0].cursor, 'base64').toString('utf8')).toEqual('cursor:1')
  })

  it('can paginate backward from a before cursor', async () => {
    const schema = makeTestSchema({
      encodeCursor: (str) => str,
      decodeCursor: (str) => str,
    })
    const first = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: 9 },
    })
    expect(first.data?.users.pageInfo).toEqual({
      hasNextPage: true,
      hasPreviousPage: false,
      startCursor: 'cursor:0',
      endCursor: 'cursor:8',
    })
    const lastNodes = await executeOk({
      schema,
      document: UsersLastBefore,
      variableValues: {
        last: 3,
        before: first.data?.users.pageInfo.endCursor,
      },
    })
    expect(lastNodes.data?.users.pageInfo).toEqual({
      startCursor: 'cursor:5',
      endCursor: 'cursor:7',
      hasNextPage: true,
      hasPreviousPage: true,
    })
  })

  it('can paginate backward without a before with a custom cursorFromNodes', async () => {
    const getTotalCount = async () => Promise.resolve(100)
    const schema = makeTestSchema({
      encodeCursor: (str) => str,
      decodeCursor: (str) => str,
      cursorFromNode: async (node, args, ctx, info, { index, nodes }) => {
        if (args.last && !args.before) {
          const totalCount = await getTotalCount()
          return `cursor:${totalCount - args.last + index + 1}`
        }
        return connectionPlugin.defaultCursorFromNode(node, args, ctx, info, {
          index,
          nodes,
        })
      },
    })
    const lastNodes = await executeOk({
      schema,
      document: UsersLast,
      variableValues: {
        last: 3,
      },
    })
    expect(lastNodes.data?.users.pageInfo).toEqual({
      startCursor: 'cursor:98',
      endCursor: 'cursor:100',
      hasNextPage: false,
      hasPreviousPage: true,
    })
  })

  it('cannot paginate backward without a before cursor or a custom cursorFromNodes', async () => {
    const schema = makeTestSchema({
      encodeCursor: (str) => str,
      decodeCursor: (str) => str,
    })
    const lastNodes = await execute({
      schema,
      document: UsersLast,
      variableValues: {
        last: 3,
      },
    })
    expect(lastNodes.errors).toEqual([
      new GraphQLError(`Cannot paginate backward without a "before" cursor by default.`),
    ])
  })

  it('should resolve pageInfo with basics', async () => {
    const schema = makeTestSchema({})
    const lastNodes = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: 10 },
    })
    expect(lastNodes.data?.users.pageInfo).toEqual({
      endCursor: 'Y3Vyc29yOjk=',
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: 'Y3Vyc29yOjA=',
    })
  })

  it('should resolve nodes & edges at the same time', async () => {
    const schema = makeTestSchema({
      includeNodesField: true,
    })
    const lastNodes = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: 10 },
    })
    expect(lastNodes.data?.users.nodes).toEqual(lastNodes.data?.users.edges.map((e: any) => e.node))
  })

  it('can define custom resolve', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes: undefined,
        resolve: customResolveFn,
      }
    )
    const lastNodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 2 },
    })
    expect(lastNodes).toMatchSnapshot()
  })

  it('can define custom resolve, which will derive nodes if includeNodesField is true', async () => {
    const schema = makeTestSchema(
      {
        includeNodesField: true,
      },
      {
        nodes: undefined,
        resolve: customResolveFn,
      }
    )
    const lastNodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 2 },
    })
    expect(lastNodes).toMatchSnapshot()
  })

  it('can define custom resolve, supplying nodes directly', async () => {
    const schema = makeTestSchema(
      {
        includeNodesField: true,
      },
      {
        nodes: undefined,
        resolve: (...args) => {
          const result = customResolveFn(...args)
          return {
            ...result,
            nodes: result.edges.map((e: any) => e.node),
          }
        },
      }
    )
    const lastNodes = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: 2 },
    })
    expect(lastNodes).toMatchSnapshot()
  })

  it('default arg validation: throws if no connection are provided', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: parse(`{ users { edges { cursor } } }`),
      variableValues: {},
    })
    expect(result).toEqual({
      data: { users: null },
      errors: [new GraphQLError('The Query.users connection field requires a "first" or "last" argument')],
    })
  })

  it('default arg validation: allows first to be zero', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 0 },
    })
    expect(result).toEqual({
      data: {
        users: {
          edges: [],
          pageInfo: {
            endCursor: null,
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: null,
          },
        },
      },
    })
  })

  it('default arg validation: allows last to be zero', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: UsersLast,
      variableValues: { last: 0 },
    })
    expect(result).toEqual({
      data: {
        users: {
          edges: [],
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: null,
          },
        },
      },
    })
  })

  it('default arg validation: throws if both first & last are provided', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: parse(`{ users(first: 2, last: 1) { edges { cursor } } }`),
      variableValues: {},
    })
    expect(result).toEqual({
      data: { users: null },
      errors: [
        new GraphQLError('The Query.users connection field requires a "first" or "last" argument, not both'),
      ],
    })
  })

  it('default arg validation: throws if first & before are mixed', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: parse(`{ users(first: 1, before: "FAKE") { edges { cursor } } }`),
      variableValues: {},
    })
    expect(result).toEqual({
      data: { users: null },
      errors: [
        new GraphQLError('The Query.users connection field does not allow a "before" argument with "first"'),
      ],
    })
  })

  it('default arg validation: throws if last & after are mixed', async () => {
    const schema = makeTestSchema({})
    const result = await execute({
      schema,
      document: parse(`{ users(last: 2, after: "FAKE") { edges { cursor } } }`),
      variableValues: {},
    })
    expect(result).toEqual({
      data: { users: null },
      errors: [
        new GraphQLError('The Query.users connection field does not allow a "last" argument with "after"'),
      ],
    })
  })

  it('returns null and logs an error if the nodes resolve is missing', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation()
    const schema = makeTestSchema(
      {
        includeNodesField: true,
      },
      {
        nodes: undefined,
      }
    )
    const lastNodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 2 },
    })
    expect(lastNodes.data?.users).toEqual(null)
    expect(consoleError).toHaveBeenCalledTimes(1)
    expect(consoleError).toHaveBeenLastCalledWith(
      new Error('Nexus Connection Plugin: Missing nodes or resolve property for Query.users')
    )
  })

  it('returns empty arrays, but warns if the nodes returns null', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
    const schema = makeTestSchema(
      {
        includeNodesField: true,
      },
      {
        nodes() {
          return null as any
        },
      }
    )
    const lastNodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 2 },
    })
    expect(lastNodes.data?.users).toEqual({
      edges: [],
      nodes: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    })
    expect(consoleWarn).toHaveBeenCalledTimes(1)
    expect(consoleWarn).toHaveBeenLastCalledWith(
      'You resolved null/undefined from nodes() at path ["users"], this is likely an error. Return an empty array to suppress this warning.'
    )
  })

  it('resolves any promises in nodes', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes() {
          return userNodes.map((node) => Promise.resolve(node))
        },
      }
    )
    const result = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 10 },
    })
    expect(result).toMatchSnapshot()
  })

  it('returns list as length of nodes if result is smaller than requested', async () => {
    const schema = makeTestSchema(
      {
        includeNodesField: true,
      },
      {
        nodes() {
          return userNodes
        },
      }
    )
    const result = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: 1000 },
    })
    expect(result.data?.users.nodes.length).toEqual(10)
  })

  it('should respect nullability of connection field', async () => {
    const getConnectionFieldType = (schema: GraphQLSchema) =>
      schema.getQueryType()?.getFields()['users'].type.toString()

    const nullable = makeTestSchema(
      {},
      {
        // @ts-ignore
        nullable: true,
      }
    )
    const nonNullable = makeTestSchema(
      {},
      {
        // @ts-ignore
        nullable: false,
      }
    )
    const nullableWithDefaultTrue = makeTestSchema(
      {},
      {
        // @ts-ignore
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const nonNullWithDefaultTrue = makeTestSchema(
      {},
      {
        // @ts-ignore
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(getConnectionFieldType(nullable)).toEqual('UserConnection')
    expect(getConnectionFieldType(nonNullable)).toEqual('UserConnection!')
    expect(getConnectionFieldType(nullableWithDefaultTrue)).toEqual('UserConnection')
    expect(getConnectionFieldType(nonNullWithDefaultTrue)).toEqual('UserConnection!')
  })
})

describe('global plugin configuration', () => {
  it('allows disabling forward pagination', () => {
    const schema = makeTestSchema({
      disableForwardPagination: true,
    })
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('allows disabling backward pagination', () => {
    const schema = makeTestSchema({
      disableBackwardPagination: true,
    })
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('allows disabling forward pagination w/ strictArgs:false to make `last` nullable', () => {
    const schema = makeTestSchema({
      disableForwardPagination: true,
      strictArgs: false,
    })
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('allows disabling backward pagination w/ strictArgs: false to make `first` nullable', () => {
    const schema = makeTestSchema({
      disableBackwardPagination: true,
      strictArgs: false,
    })
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('can configure additional fields for the connection globally', () => {
    const schema = makeTestSchema(
      {
        extendConnection: {
          totalCount: {
            type: 'Int',
          },
        },
      },
      {
        // @ts-ignore
        totalCount: () => 1,
      }
    )
    expect(printType(schema.getType('UserConnection')!)).toMatchSnapshot()
  })

  it('logs error if the extendConnection resolver is not specified', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    makeTestSchema({
      extendConnection: {
        totalCount: {
          type: 'Int',
        },
      },
    })
    expect(spy.mock.calls[0]).toMatchSnapshot()
    expect(spy).toBeCalledTimes(1)
  })

  it('logs error if the extendEdge resolver is not specified', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    makeTestSchema({
      extendEdge: {
        totalCount: {
          type: 'Int',
        },
      },
    })
    expect(spy.mock.calls[0]).toMatchSnapshot()
    expect(spy).toBeCalledTimes(1)
  })

  it('can configure additional fields for the edge globally', () => {
    const schema = makeTestSchema(
      {
        extendEdge: {
          createdAt: {
            type: 'String',
          },
        },
      },
      {
        // @ts-ignore
        edgeFields: {
          createdAt: () => 'FakeDate',
        },
      }
    )
    expect(printType(schema.getType('UserEdge')!)).toMatchSnapshot()
  })

  it('can include a "nodes" field, with an array of nodes', () => {
    const schema = makeTestSchema({
      includeNodesField: true,
    })
    expect(schema.getType('UserConnection')!).toMatchSnapshot()
  })

  it('can define additional args for all connections', () => {
    const schema = makeTestSchema({
      additionalArgs: {
        order: arg({
          type: nonNull('String'),
          description: 'This should be included',
        }),
      },
    })
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })
})

describe('field level configuration', () => {
  it('can configure the connection per-instance', () => {
    const schema = makeTestSchema(
      {},
      {
        extendConnection(t) {
          t.int('totalCount', { resolve: () => 1 })
        },
      }
    )
    expect(printType(schema.getType('QueryUsers_Connection')!)).toMatchSnapshot()
    expect(schema.getType('QueryUsers_Edge')).toBeUndefined()
  })

  it('can configure the edge per-instance', () => {
    const schema = makeTestSchema(
      {},
      {
        extendEdge(t) {
          t.string('role', { resolve: () => 'admin' })
        },
      }
    )
    expect(printType(schema.getType('QueryUsers_Connection')!)).toMatchSnapshot()
    expect(printType(schema.getType('QueryUsers_Edge')!)).toMatchSnapshot()
  })

  it('can modify the behavior of cursorFromNode ', () => {})

  it('can define additional args for the connection', () => {
    const schema = makeTestSchema(
      {
        additionalArgs: {
          order: arg({
            type: nonNull('String'),
            description: 'This should be ignored',
          }),
        },
      },
      {
        additionalArgs: {
          filter: arg({
            type: 'String',
            description: 'This should be included',
          }),
        },
      }
    )
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('can inherit the additional args from the main config', () => {
    const schema = makeTestSchema(
      {
        additionalArgs: {
          order: arg({
            type: nonNull('String'),
            description: 'This should be included',
          }),
        },
      },
      {
        inheritAdditionalArgs: true,
        additionalArgs: {
          filter: arg({
            type: 'String',
            description: 'This should also be included',
          }),
        },
      }
    )
    expect(printType(schema.getQueryType()!)).toMatchSnapshot()
  })

  it('can define a schema with multiple plugins, and separate them by typePrefix', () => {
    const schema = makeSchema({
      outputs: false,
      types: [
        objectType({
          name: 'Query',
          definition(t) {
            // @ts-ignore
            t.connectionField('users', {
              type: User,
              nodes(root: any, args: any, ctx: any, info: any) {
                return userNodes
              },
            })
            // @ts-ignore
            t.analyticsConnectionField('userStats', {
              type: User,
              nodes() {
                return userNodes
              },
            })
          },
        }),
      ],
      plugins: [
        connectionPlugin({}),
        connectionPlugin({
          typePrefix: 'Analytics',
          nexusFieldName: 'analyticsConnectionField',
          extendConnection: {
            totalCount: { type: 'Int' },
            averageCount: { type: 'Int' },
          },
        }),
      ],
      nonNullDefaults: {
        input: false,
        output: false,
      },
    })
    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('prints the types associated with the connection plugin correctly', async () => {
    const { tsTypes } = await generateSchema.withArtifacts(
      {
        outputs: false,
        types: [
          objectType({
            name: 'Query',
            definition(t) {
              // @ts-ignore
              t.connectionField('users', {
                type: User,
                nodes(root: any, args: any, ctx: any, info: any) {
                  return userNodes
                },
              })
            },
          }),
        ],
        plugins: [connectionPlugin()],
      },
      '/dev/null'
    )

    const regExp = /interface NexusGenCustomOutputMethods(?:.*) {((.|\n)*?)}/
    expect(regExp.exec(tsTypes)?.[1]).toMatchSnapshot()
  })

  it('#670 should explicitly state nullability for connectionPlugin args & fields', async () => {
    const { schema } = await generateSchema.withArtifacts({
      outputs: false,
      types: [
        objectType({
          name: 'Query',
          definition(t) {
            // @ts-ignore
            t.connectionField('users', {
              type: User,
              nodes(root: any, args: any, ctx: any, info: any) {
                return userNodes
              },
            })
          },
        }),
      ],
      plugins: [connectionPlugin()],
      nonNullDefaults: {
        input: true,
        output: true,
      },
    })

    expect(printSchema(schema)).toMatchSnapshot()
  })

  it('#450 can extend connection edge with custom field', async () => {
    const schema = makeSchema({
      outputs: false,
      types: [
        objectType({
          name: 'Query',
          definition(t) {
            // @ts-ignore
            t.connectionField('users', {
              type: User,
              nodes(root: any, args: any, ctx: any, info: any) {
                return userNodes
              },
              edgeFields: {
                delta: (root) => {
                  return root.node.id.split(':')[1]
                },
              },
            })
          },
        }),
      ],
      plugins: [
        connectionPlugin({
          extendEdge: {
            delta: {
              type: 'Int',
            },
          },
        }),
      ],
      nonNullDefaults: {
        input: true,
        output: true,
      },
    })

    const result = await execute({
      schema,
      document: parse(`{ users(first: 10) { edges { delta } } }`),
    })

    expect(result.data?.users.edges.map((e) => e.delta)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })
})
