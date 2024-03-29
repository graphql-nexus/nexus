import { graphql, GraphQLID, GraphQLNonNull, GraphQLObjectType } from 'graphql'
import {
  enumType,
  interfaceType,
  list,
  makeSchema,
  nullabilityGuardPluginCore,
  nullabilityGuardPlugin,
  objectType,
  queryField,
  unionType,
} from '../../src'

type NullabilityGuardConfig = nullabilityGuardPluginCore.NullabilityGuardConfig

const NODE_ENV = process.env.NODE_ENV

const onGuardedMock = jest.fn()

const defaultFallbacks: NullabilityGuardConfig['fallbackValues'] = {
  ID: ({ info }) => `${info.parentType.name}:N/A`,
  Int: () => -1,
  String: () => '',
  Boolean: () => false,
  Float: () => null as any, // intended to fail
}

const nullPlugin = (config: NullabilityGuardConfig = {}) =>
  nullabilityGuardPlugin({
    onGuarded: onGuardedMock,
    fallbackValues: {
      ...defaultFallbacks,
    },
    shouldGuard: true,
    ...config,
  })

const types = [
  new GraphQLObjectType({
    name: 'SomeObjectType',
    description: 'Showing that the defaults works for all resolvers, not just Nexus ones',
    fields: () => ({
      id: {
        type: new GraphQLNonNull(GraphQLID),
      },
    }),
  }),
  interfaceType({
    name: 'UserLike',
    resolveType(o) {
      return o.__typename
    },
    definition(t) {
      t.id('id')
      t.string('login')
    },
  }),
  objectType({
    name: 'User',
    definition(t) {
      t.implements('UserLike')
      t.string('login')
      t.list.field('usersList', {
        type: 'User',
        // @ts-ignore
        skipNullGuard: true,
        resolve: () => {
          return [{ id: `A:1` }, { id: `B:2` }]
        },
      })
    },
    sourceType: '{ id: string }',
  }),
  objectType({
    name: 'Account',
    definition(t) {
      t.id('id')
      t.string('displayName')
    },
    sourceType: '{ id: string }',
  }),
  queryField('objType', {
    type: 'SomeObjectType' as any,
    resolve: () => ({} as any),
  }),
  queryField('getUser', {
    type: 'User',
    resolve: () => ({
      id: 'User: 1',
    }),
  }),
  queryField('getUserWithGuard', {
    type: 'User',
    resolve: () => ({
      id: null as any,
    }),
  }),
  queryField('intList', {
    type: list('Int'),
    resolve: () => [1, 2, null],
  }),
  queryField('userList', {
    type: list('User'),
    resolve: () => [null, Promise.resolve(null), null],
  }),
  queryField('interfaceType', {
    type: 'UserLike',
    resolve: () => null,
  }),
  queryField('enumType', {
    type: 'SomeEnum',
    resolve: () => null,
  }),
  queryField('shouldFail', {
    type: 'Float',
    resolve: () => null,
  }),
  enumType({
    name: 'SomeEnum',
    members: ['A', 'B', 'C'],
  }),
]

const defaultSchema = makeSchema({
  types,
  plugins: [nullPlugin()],
  outputs: false,
  nonNullDefaults: {
    output: true,
  },
  features: {
    abstractTypeStrategies: {
      resolveType: true,
    },
  },
})

describe('nullabilityGuardPlugin', () => {
  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

  beforeEach(() => {
    jest.resetAllMocks()
  })

  afterEach(() => {
    process.env.NODE_ENV = NODE_ENV
  })

  it('should trigger the nullability guard', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          getUserWithGuard {
            id
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.getUserWithGuard).toEqual({ id: 'User:N/A' })
    expect(onGuardedMock).toBeCalledTimes(1)
  })

  it('should fill ints with a default', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          intList
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.intList).toEqual([1, 2, -1])
    expect(onGuardedMock).toBeCalledTimes(1)
  })

  it('should fill with defaults', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          userList {
            id
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.userList).toEqual([{ id: 'User:N/A' }, { id: 'User:N/A' }, { id: 'User:N/A' }])
    // Once for each null, once for each "id" field
    expect(onGuardedMock).toBeCalledTimes(6)
  })

  it('should guard on GraphQLObjectType fields', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          objType {
            id
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.objType).toEqual({ id: 'SomeObjectType:N/A' })
    expect(onGuardedMock).toBeCalledTimes(1)
  })

  it('should guard interface types', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          interfaceType {
            __typename
            id
            login
            ... on User {
              usersList {
                id
              }
            }
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.interfaceType).toEqual({
      __typename: 'User',
      id: 'User:N/A',
      login: '',
      usersList: [{ id: 'A:1' }, { id: 'B:2' }],
    })
    expect(onGuardedMock).toBeCalledTimes(3)
  })

  it('should guard union types', async () => {
    const { errors = [], data } = await graphql({
      schema: makeSchema({
        outputs: false,
        nonNullDefaults: {
          output: true,
        },
        types: [
          types,
          unionType({
            name: 'UserOrAccount',
            definition(t) {
              t.members('User', 'Account')
            },
          }),
          queryField('unionType', {
            type: 'UserOrAccount',
            resolve: () => null,
          }),
        ],
        plugins: [nullPlugin()],
        features: {
          abstractTypeStrategies: {
            resolveType: true,
          },
        },
      }),
      source: `
        {
          unionType {
            __typename
            ... on User {
              id
              login
            }
            ... on Account {
              id
              displayName
            }
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.unionType).toEqual({
      __typename: 'User',
      id: 'User:N/A',
      login: '',
    })
    expect(onGuardedMock).toBeCalledTimes(3)
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy.mock.calls[0][0].message).toContain(
      'You have a faulty implementation for your union type "UserOrAccount". It is missing a `resolveType` implementation.'
    )
  })

  it('should guard on enumType fields', async () => {
    const { errors = [], data } = await graphql({
      schema: defaultSchema,
      source: `
        {
          enumType
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.enumType).toEqual('A')
    expect(onGuardedMock).toBeCalledTimes(1)
  })

  it('should warn by default if onGuarded is not provided', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementationOnce(() => {})
    const schema = makeSchema({
      outputs: false,
      nonNullDefaults: {
        output: true,
      },
      types,
      plugins: [nullPlugin({ onGuarded: undefined })],
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    const { errors = [], data } = await graphql({
      schema,
      source: `
        {
          getUserWithGuard {
            id
          }
        }
      `,
    })
    expect(errors).toEqual([])
    expect(data!.getUserWithGuard).toEqual({ id: 'User:N/A' })
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy).toHaveBeenCalledWith('Nullability guard called for User.id')
  })

  it('should not catch by default unless the env is production', async () => {
    const schema = makeSchema({
      types,
      outputs: false,
      nonNullDefaults: {
        output: true,
      },
      plugins: [nullPlugin({ shouldGuard: undefined })],
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    const { errors = [], data } = await graphql({
      schema,
      source: `
        {
          getUserWithGuard {
            id
          }
        }
      `,
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toEqual('Cannot return null for non-nullable field User.id.')
    expect(data).toBeNull()
    process.env.NODE_ENV = 'production'
    const schema2 = makeSchema({
      types,
      outputs: false,
      nonNullDefaults: {
        output: true,
      },
      plugins: [nullPlugin({ shouldGuard: undefined })],
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    const { errors: errors2 = [], data: data2 } = await graphql({
      schema: schema2,
      source: `
        {
          getUserWithGuard {
            id
          }
        }
      `,
    })
    expect(errors2).toEqual([])
    expect(data2!.getUserWithGuard).toEqual({ id: 'User:N/A' })
  })

  it('logs an error if scalars are missing', () => {
    const { String, ...rest } = defaultFallbacks
    makeSchema({
      types,
      outputs: false,
      plugins: [
        nullPlugin({
          fallbackValues: {
            ...rest,
          },
        }),
      ],
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy).toHaveBeenCalledWith(
      'No nullability guard was provided for Scalar String. Provide one in the nullabilityGuard config to remove this warning.'
    )
  })

  it('logs an error for unknown/unused scalars', () => {
    makeSchema({
      types,
      outputs: false,
      plugins: [
        nullPlugin({
          fallbackValues: {
            ...defaultFallbacks,
            JSON: () => ({}),
          },
        }),
      ],
      features: {
        abstractTypeStrategies: {
          resolveType: true,
        },
      },
    })
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy).toHaveBeenCalledWith(
      'Unknown type JSON provided in nullabilityGuard fallbackValues config.'
    )
  })

  it('will still fail if it cant handle with a guard', async () => {
    const { errors = [] } = await graphql({
      schema: defaultSchema,
      source: `
        {
          shouldFail
        }
      `,
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toEqual('Cannot return null for non-nullable field Query.shouldFail.')
  })

  it('will return null for nullable list values', async () => {
    const onGuardedMock = jest.fn()
    const { errors = [], data } = await graphql({
      schema: makeSchema({
        types: [
          queryField('nullableList', {
            type: list('String'),
            resolve: async () => null,
          }),
        ],
        outputs: false,
        plugins: [
          nullPlugin({
            onGuarded: onGuardedMock,
          }),
        ],
      }),
      source: `
        {
          nullableList
        }
      `,
    })
    expect(errors).toHaveLength(0)
    expect(data!.nullableList).toEqual(null)
    expect(onGuardedMock).toHaveBeenCalledTimes(0)
  })
})
