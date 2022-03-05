import {
  execute,
  ExecutionArgs,
  GraphQLError,
  GraphQLFieldResolver,
  GraphQLSchema,
  lexicographicSortSchema,
  parse,
  printSchema,
  printType,
} from 'graphql'
import { connectionFromArray } from 'graphql-relay'
import { arg, connectionPlugin, makeSchema, nonNull, objectType } from '../../src'
import { generateSchema, SchemaConfig, scalarType, queryField } from '../../src/core'
import type { ConnectionFieldConfig, ConnectionPluginConfig } from '../../src/plugins/connectionPlugin'

const userNodes: { id: string; name: string }[] = []
for (let i = 0; i < 10; i++) {
  userNodes.push({ id: `User:${i + 1}`, name: `Test ${i + 1}` })
}

const upperFirst = (fieldName: string) => {
  return fieldName.slice(0, 1).toUpperCase().concat(fieldName.slice(1))
}

const User = objectType({
  name: 'User',
  definition(t) {
    t.id('id')
    t.string('name')
  },
})

const CountFieldBody = `
  count(round: $round)
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
const DeltaFieldBody = `
  edges {
    delta(format: $format)
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

const UsersAll = parse(`query UsersAll { users { ${UsersFieldBody} } }`)

const UsersLast = parse(`query UsersFieldLast($last: Int!) { users(last: $last) { ${UsersFieldBody} } }`)
const UsersLastBefore = parse(
  `query UsersFieldLastBefore($last: Int!, $before: String!) { users(last: $last, before: $before) { ${UsersFieldBody} } }`
)
const UsersFirst = parse(`query UsersFieldFirst($first: Int!) { users(first: $first) { ${UsersFieldBody} } }`)
const UsersFirstAfter = parse(
  `query UsersFieldFirstAfter($first: Int!, $after: String!) { users(first: $first, after: $after) { ${UsersFieldBody} } }`
)
const CountFirst = parse(
  `query CountField($first: Int!, $after: String, $round: Int, $ok: Boolean!) {
    ok(ok: $ok)
    users(first: $first, after: $after) { ${CountFieldBody} } 
  }`
)
const DeltaFirst = parse(
  `query DeltaField($first: Int!, $after: String, $format: String, $ok: Boolean!) {
    ok(ok: $ok)
    users(first: $first, after: $after) { ${DeltaFieldBody} } 
  }`
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
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {},
  additionalTypes: any[] = []
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
          t.boolean('ok', {
            args: {
              ok: 'Boolean',
            },
          })
        },
      }),
      ...additionalTypes,
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.users.pageInfo.hasPreviousPage).toEqual(true)
  })
  it('should provide forward pagination defaults', async () => {
    const schema = makeTestSchema({})
    const nodes = await execute({
      schema,
      document: UsersFirst,
      variableValues: { first: 1 },
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(nodes.data?.users.edges).toEqual([{ cursor: 'Y3Vyc29yOjA=', node: { id: 'User:1' } }])
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
        // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
        before: first.data?.users.pageInfo.endCursor,
      },
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
            // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
            ...result,
            // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
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

  it('iterates all nodes if neither first/last are matched', async () => {
    const schema = makeTestSchema({
      disableBackwardPagination: true,
      strictArgs: false,
      pageInfoFromNodes() {
        return { hasNextPage: false, hasPreviousPage: false }
      },
      validateArgs() {},
    })
    const result = await executeOk({
      schema,
      document: UsersAll,
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.users?.edges.length).toEqual(10)
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

  it('can configure connection names globally', () => {
    const suffix = 'TestGlobalConnection'
    const schema = makeTestSchema({
      getConnectionName(fieldName, parentTypeName) {
        return `${parentTypeName}${upperFirst(fieldName)}${suffix}`
      },
    })

    expect(schema.getType(`QueryUsers${suffix}`)).toMatchSnapshot()
  })

  it('can configure edge names globally', () => {
    const suffix = 'TestGlobalEdge'
    const schema = makeTestSchema({
      getEdgeName(fieldName, parentTypeName) {
        return `${parentTypeName}${upperFirst(fieldName)}${suffix}`
      },
    })

    expect(schema.getType(`QueryUsers${suffix}`)).toMatchSnapshot()
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

  it('skips error if the extendEdge resolver is not specified and requireResolver is set to false', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    makeTestSchema({
      extendEdge: {
        totalCount: {
          type: 'Int',
          requireResolver: false,
        },
      },
    })
    expect(spy).toBeCalledTimes(0)
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

  it('can configure connection names per-instance', () => {
    const suffix = 'TestFieldConnection'
    const schema = makeTestSchema(
      {},
      {
        getConnectionName(fieldName, parentTypeName) {
          return `${parentTypeName}${upperFirst(fieldName)}${suffix}`
        },
      }
    )

    expect(schema.getType(`QueryUsers${suffix}`)).toMatchSnapshot()
  })

  it('can configure edge names per-instance', () => {
    const suffix = 'TestFieldEdge'
    const schema = makeTestSchema(
      {},
      {
        getEdgeName(fieldName, parentTypeName) {
          return `${parentTypeName}${upperFirst(fieldName)}${suffix}`
        },
      }
    )

    expect(schema.getType(`QueryUsers${suffix}`)).toMatchSnapshot()
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
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
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

    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
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
                delta: (root: any) => {
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
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.users.edges.map((e: any) => e.delta)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('#515 - custom non-string cursor type', async () => {
    const { schema } = await generateSchema.withArtifacts({
      outputs: false,
      types: [
        scalarType({
          name: 'UUID',
          serialize() {},
          parseLiteral() {},
          parseValue() {},
        }),
        scalarType({
          name: 'UUID4',
          serialize() {},
        }),
        objectType({
          name: 'Query',
          definition(t) {
            // @ts-ignore
            t.connectionField('pluginLevel', {
              type: User,
            })
            // @ts-ignore
            t.connectionField('fieldLevel', {
              type: User,
              cursorType: nonNull('UUID'),
            })
            // @ts-ignore
            t.connectionField('fieldLevel2', {
              type: User,
              cursorType: 'UUID4',
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
          cursorType: 'UUID',
        }),
      ],
      nonNullDefaults: {
        input: true,
        output: true,
      },
    })

    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })

  it('#479 allows a promise to be returned from pageInfoFromNodes', async () => {
    const schema = makeTestSchema({
      async pageInfoFromNodes() {
        return {
          hasNextPage: true,
          hasPreviousPage: false,
        }
      },
    })

    const result = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: {
        first: 1,
      },
    })
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.users.pageInfo.hasNextPage).toEqual(true)
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(result.data?.users.pageInfo.hasPreviousPage).toEqual(false)
  })
})

describe('connectionPlugin extensions', () => {
  describe('should receive the connection args when extending', () => {
    test('the connection type on the schema', async () => {
      const schema = makeTestSchema(
        {
          extendConnection: {
            count: {
              type: 'Int',
              args: {
                round: 'Int',
              },
            },
          },
        },
        {
          // @ts-ignore
          count(root, args, ctx) {
            expect(args).toEqual({
              first: 1,
              after: '0',
              round: 100,
            })
            return 100
          },
        }
      )
      await executeOk({
        schema,
        document: CountFirst,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          round: 100,
          ok: true,
        },
      })
    })

    test('the connection type on the field', async () => {
      expect.assertions(2)
      const schema = makeTestSchema(
        {},
        {
          extendConnection(t) {
            t.int('count', {
              args: {
                round: 'Int',
              },
              resolve(root, args, ctx) {
                expect(args).toEqual({
                  first: 1,
                  after: '0',
                  round: 100,
                })
                return 100
              },
            })
          },
        }
      )
      await executeOk({
        schema,
        document: CountFirst,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          round: 100,
          ok: true,
        },
      })
    })

    test('the edge type on the schema', async () => {
      expect.assertions(2)
      const schema = makeTestSchema(
        {
          extendEdge: {
            delta: {
              type: 'String',
              args: {
                format: 'String',
              },
            },
          },
        },
        {
          edgeFields: {
            // @ts-ignore
            delta(root, args, ctx) {
              expect(args).toEqual({
                first: 1,
                after: '0',
                format: 'ms',
              })
              return '5ms'
            },
          },
        }
      )
      await executeOk({
        schema,
        document: DeltaFirst,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          format: 'ms',
          ok: true,
        },
      })
    })

    test('the edge type on the field', async () => {
      expect.assertions(2)
      const schema = makeTestSchema(
        {},
        {
          extendEdge(t) {
            t.string('delta', {
              args: {
                format: 'String',
              },
              resolve(root, args, ctx) {
                expect(args).toEqual({
                  first: 1,
                  after: '0',
                  format: 'ms',
                })
                return '5ms'
              },
            })
          },
        }
      )
      await executeOk({
        schema,
        document: DeltaFirst,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          format: 'ms',
          ok: true,
        },
      })
    })
  })

  describe('should receive the connection source field when extending', () => {
    test('the connection type on the schema', async () => {
      const schema = makeTestSchema(
        {
          extendConnection: {
            count: {
              type: 'Int',
              args: {
                round: 'Int',
              },
            },
          },
        },
        {
          // @ts-ignore
          count(root, args, ctx) {
            expect(root).toEqual({ someId: 123 })
            return 100
          },
        }
      )
      await executeOk({
        schema,
        document: CountFirst,
        rootValue: { someId: 123 },
        variableValues: { first: 1, ok: true },
      })
    })

    test('the connection type on the field', async () => {
      expect.assertions(2)
      const schema = makeTestSchema(
        {},
        {
          extendConnection(t) {
            t.int('count', {
              args: {
                round: 'Int',
              },
              resolve(root, args, ctx) {
                expect(root).toEqual({ someId: 123 })
                return 100
              },
            })
          },
        }
      )
      await executeOk({
        schema,
        document: CountFirst,
        rootValue: { someId: 123 },
        variableValues: { first: 1, ok: true },
      })
    })
  })

  describe('should call the correct fn when extending', () => {
    it('edge field', async () => {
      const DeltaTwice = parse(
        `query DeltaField($first: Int!, $after: String, $format: String, $ok: Boolean!) {
          ok(ok: $ok)
          users(first: $first, after: $after) { ${DeltaFieldBody} } 
          users2(first: $first, after: $after) { ${DeltaFieldBody} } 
        }`
      )

      const first = jest.fn().mockImplementation(() => 1)
      const second = jest.fn().mockImplementation(() => 2)

      const schema = makeTestSchema(
        {
          extendEdge: {
            delta: {
              type: 'Int',
            },
          },
        },
        {
          // @ts-ignore
          edgeFields: {
            delta: first,
          },
        },
        {},
        [
          queryField((t) => {
            // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
            t.connectionField('users2', {
              type: User,
              nodes(root: any, args: any, ctx: any, info: any) {
                return userNodes
              },
              edgeFields: {
                delta: second,
              },
            })
          }),
        ]
      )

      await executeOk({
        schema,
        document: DeltaTwice,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          format: 'ms',
          ok: true,
        },
      })
      expect(first).toBeCalledTimes(1)
      expect(second).toBeCalledTimes(1)
    })

    it('connection field', async () => {
      const CountTwice = parse(
        `query CountField($first: Int!, $after: String, $round: Int, $ok: Boolean!) {
          ok(ok: $ok)
          users(first: $first, after: $after) { ${CountFieldBody} } 
          users2(first: $first, after: $after) { ${CountFieldBody} } 
        }`
      )

      const first = jest.fn().mockImplementation(() => 1)
      const second = jest.fn().mockImplementation(() => 2)

      const schema = makeTestSchema(
        {
          extendConnection: {
            count: {
              type: 'Int',
              args: {
                round: 'Int',
              },
            },
          },
        },
        {
          // @ts-ignore
          count: first,
        },
        {},
        [
          queryField((t) => {
            // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
            t.connectionField('users2', {
              type: User,
              nodes(root: any, args: any, ctx: any, info: any) {
                return userNodes
              },
              count: second,
            })
          }),
        ]
      )

      await executeOk({
        schema,
        document: CountTwice,
        variableValues: {
          first: 1,
          after: 'Y3Vyc29yOjA=',
          format: 'ms',
          ok: true,
        },
      })
      expect(first).toBeCalledTimes(1)
      expect(second).toBeCalledTimes(1)
    })
  })
})

describe('iteration', () => {
  const MAX_INT = 2147483647

  it('only iterates the necessary number of nodes forward', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes(root: any, args: any) {
          expect(args).toEqual({ first: MAX_INT })
          return userNodes
        },
      }
    )
    const start = new Date().valueOf()
    const nodes = await executeOk({
      schema,
      document: UsersFirst,
      variableValues: { first: MAX_INT },
    })
    const end = new Date().valueOf()
    expect(end - start).toBeLessThan(1000) // This was taking awhile when looping i < first
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(nodes.data?.users.edges.length).toEqual(10)
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(Buffer.from(nodes.data?.users.edges[0].cursor, 'base64').toString('utf8')).toEqual('cursor:0')
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(Buffer.from(nodes.data?.users.edges[9].cursor, 'base64').toString('utf8')).toEqual('cursor:9')
  })

  it('only iterates the necessary number of nodes backward', async () => {
    const schema = makeTestSchema(
      {},
      {
        nodes(root: any, args: any) {
          expect(args).toEqual({ last: MAX_INT, before: '9' })
          return userNodes.slice(0, Number(args.before) - userNodes.length)
        },
      }
    )
    const start = new Date().valueOf()
    const nodes = await executeOk({
      schema,
      document: UsersLastBefore,
      variableValues: { last: MAX_INT, before: 'Y3Vyc29yOjk=' },
    })
    const end = new Date().valueOf()
    expect(end - start).toBeLessThan(1000) // This was taking awhile when looping i < last
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(nodes.data?.users.edges.length).toEqual(9)
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(Buffer.from(nodes.data?.users.edges[0].cursor, 'base64').toString('utf8')).toEqual('cursor:0')
    // @ts-ignore - TODO: change to @ts-expect-error when we drop v15 support
    expect(Buffer.from(nodes.data?.users.edges[8].cursor, 'base64').toString('utf8')).toEqual('cursor:8')
  })
})
