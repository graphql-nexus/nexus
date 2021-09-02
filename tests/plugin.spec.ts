import { buildSchema, graphql, GraphQLSchema, lexicographicSortSchema, printSchema } from 'graphql'
import {
  interfaceType,
  list,
  makeSchema,
  MiddlewareFn,
  nonNull,
  objectType,
  plugin,
  queryField,
  booleanArg,
  inputObjectType,
} from '../src/core'
import { nullabilityGuardPlugin } from '../src/plugins'
import { EXAMPLE_SDL } from './_sdl'
import { ensureResult } from './__helpers/ensureResult'

const nullGuardPlugin = nullabilityGuardPlugin({
  shouldGuard: true,
  fallbackValues: {
    ID: () => 'UNKNOWN_ID',
    Float: () => 0,
    Boolean: () => false,
    String: () => '',
    UUID: () => '63bcbf07-c5e7-4c89-ad07-74030a09f5f6',
  },
  onGuarded() {},
})

describe('plugin', () => {
  it('is applied to the resolver for every field in the schema', async () => {
    const lifecycleCalls: string[] = []
    const beforeCalls: string[] = []
    const afterCalls: string[] = []
    const schema = makeSchema({
      outputs: false,
      types: [buildSchema(EXAMPLE_SDL)],
      plugins: [
        plugin({
          name: 'Lifecycle test',
          onBeforeBuild: () => lifecycleCalls.push('onBeforeBuild'),
          onInstall: () => {
            lifecycleCalls.push('onInstall')
          },
          onCreateFieldResolver({ fieldConfig }) {
            return async (root, args, ctx, info, next) => {
              beforeCalls.push(`${info.parentType.name}:${info.fieldName}`)
              const val = await next(root, args, ctx, info)
              afterCalls.push(`${info.parentType.name}:${info.fieldName} ${val}`)
              return val
            }
          },
          onAfterBuild: (schema) => {
            lifecycleCalls.push('onAfterBuild')
            expect(schema).toBeInstanceOf(GraphQLSchema)
          },
        }),
        nullGuardPlugin,
      ],
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
    })
    const result = await graphql({
      schema,
      source: `
        {
          user {
            id
            name
            email
            phone
          }
          posts(filters: { order: DESC }) {
            id
            uuid
            author {
              id
            }
          }
        }
      `,
    })
    expect(lifecycleCalls).toMatchSnapshot()
    expect(beforeCalls).toMatchSnapshot()
    expect(afterCalls).toMatchSnapshot()
    expect(result).toMatchSnapshot()
  })
  it('throws when the plugin is included in the types but not the plugins array', () => {
    expect.assertions(1)
    try {
      makeSchema({
        outputs: false,
        types: [buildSchema(EXAMPLE_SDL), nullGuardPlugin],
      })
    } catch (e) {
      expect(e.message).toEqual(
        `Nexus plugin NullabilityGuard was seen in the "types" config, but should instead be provided to the "plugins" array.`
      )
    }
  })

  it('does not throw if the plugin is seen in the types as well as the plugins array', () => {
    makeSchema({
      outputs: false,
      types: [buildSchema(EXAMPLE_SDL), nullGuardPlugin],
      plugins: [nullGuardPlugin],
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
    })
  })

  it('has an onMissingType, which will be called in order when we encounter a missing type', () => {
    const schema = makeSchema({
      outputs: false,
      types: [
        objectType({
          name: 'User',
          definition(t) {
            t.id('id')
          },
        }),
        queryField('users', {
          type: 'UserConnection',
          resolve: () => [],
        }),
      ],
      plugins: [
        plugin({
          name: 'DynamicConnection',
          onMissingType(name, builder) {
            if (name === 'ConnectionInfo') {
              return objectType({
                name,
                definition(t) {
                  t.boolean('hasNextPage')
                  t.boolean('hasPrevPage')
                },
              })
            }
            const exec = /^(.*?)(Connection|Edge|Node)$/.exec(name)
            if (!exec) {
              return null
            }
            const [, typeName, fieldType] = exec
            switch (fieldType) {
              case 'Edge': {
                return objectType({
                  name: name,
                  definition(t) {
                    t.string('cursor')
                    t.field('node', { type: typeName })
                  },
                })
              }
              case 'Connection': {
                return objectType({
                  name: name,
                  definition(t) {
                    t.field('edges', {
                      type: list(`${typeName}Edge`),
                    })
                    t.field('connectionInfo', {
                      type: 'ConnectionInfo',
                    })
                  },
                })
              }
            }
          },
        }),
      ],
    })
    expect(printSchema(lexicographicSortSchema(schema))).toMatchSnapshot()
  })

  it('composes the onCreateFieldResolve fns', async () => {
    const calls: string[] = []
    const testResolve = (name: string) => (): MiddlewareFn => (root, args, ctx, info, next) => {
      calls.push(`Before:${name}`)
      return plugin.completeValue(next(root, args, ctx, info), (val) => {
        calls.push(`After:${name} ${val}`)
        return val + 1
      })
    }
    const schema = makeSchema({
      outputs: false,
      types: [
        queryField('testCompose', {
          type: 'Int',
          resolve: () => {
            calls.push('calls:resolver')
            return 1
          },
        }),
      ],
      plugins: [
        plugin({
          name: 'a',
          onCreateFieldResolver: testResolve('a'),
        }),
        plugin({
          name: 'b',
          onCreateFieldResolver: testResolve('b'),
        }),
        plugin({
          name: 'c',
          onCreateFieldResolver: testResolve('c'),
        }),
      ],
    })
    await graphql({
      schema,
      source: `
        {
          testCompose
        }
      `,
    })
    expect(calls).toMatchSnapshot()
  })

  it('has an onObjectDefinition option, which receives the object metadata', async () => {
    //
    const schema = makeSchema({
      outputs: false,
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
      types: [
        interfaceType({
          name: 'Node',
          resolveType(n) {
            return n.__typename
          },
          definition(t) {
            t.field('id', {
              type: nonNull('ID'),
              resolve: () => {
                throw new Error('Abstract')
              },
            })
          },
        }),
        objectType({
          name: 'AddsNode',
          // @ts-ignore
          node: 'id',
          definition(t) {
            t.string('name')
          },
        }),
        queryField('getNode', {
          type: 'Node',
          resolve: () => ({ __typename: 'AddsNode', name: 'test', id: 'abc' }),
        }),
      ],
      plugins: [
        plugin({
          name: 'Node',
          onObjectDefinition(t, config) {
            const node = (config as any).node as any
            if (node) {
              t.implements('Node')
              t.field('id', {
                type: nonNull('ID'),
                resolve: (root) => `${config.name}:${root[node]}`,
              })
            }
          },
        }),
      ],
    })
    const result = ensureResult(
      await graphql({
        schema,
        source: `
        {
          getNode {
            __typename
            id
            ... on AddsNode {
              name
            }
          }
        }
      `,
      })
    )
    expect(result.data?.getNode).toEqual({ __typename: 'AddsNode', id: 'AddsNode:abc', name: 'test' })
  })

  it('has an onAddOutputField / onAddInputField / onAddArg option, which receives the field metadata, and can modify the field', async () => {
    //
    const schema = makeSchema({
      outputs: false,
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
      types: [
        queryField('ok', {
          type: 'Boolean',
          // @ts-ignore
          listTest: true,
          args: {
            // @ts-ignore
            filter: booleanArg({ listTest: true }),
            input: inputObjectType({
              name: 'SomeType',
              definition(t) {
                // @ts-ignore
                t.boolean('inputField', { listTest: true })
              },
            }),
          },
          resolve: () => [true],
        }),
      ],
      plugins: [
        plugin({
          name: 'Node',
          onAddOutputField(field) {
            // @ts-ignore
            if (field.listTest) {
              field.type = list(field.type)
            }
          },
          onAddInputField(field) {
            // @ts-ignore
            if (field.listTest) {
              field.type = list(field.type)
            }
          },
          onAddArg(arg) {
            // @ts-ignore
            if (arg.listTest) {
              arg.type = list(arg.type)
            }
          },
        }),
      ],
    })
    expect(printSchema(lexicographicSortSchema(schema))).toMatchSnapshot()
  })

  it('has an plugin.inputObjectTypeDefTypes field where extra properties for inputObjectType can be added', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation()
    makeSchema({
      outputs: false,
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
      types: [
        queryField('ok', {
          type: 'Boolean',
          // @ts-ignore
          listTest: true,
          args: {
            input: inputObjectType({
              name: 'SomeType',
              definition(t) {
                // @ts-ignore
                t.boolean('inputField', { listTest: true })
              },
              // @ts-ignore
              extraData: true,
            }),
          },
          resolve: () => [true],
        }),
      ],
      plugins: [
        plugin({
          name: 'Node',
          inputObjectTypeDefTypes: 'extraData?: bool',
          onAddArg: (field) => {
            expect(field.type.config.extraData).toBe(true)
          },
        }),
      ],
    })
    expect(spy).toBeCalledTimes(0)
  })

  it('has a plugin.completeValue fn which is used to efficiently complete a value which is possibly a promise', async () => {
    const calls: string[] = []
    const testResolve = (name: string) => (): MiddlewareFn => async (root, args, ctx, info, next) => {
      calls.push(`Before:${name}`)
      return plugin.completeValue(next(root, args, ctx, info), (val) => {
        calls.push(`After:${name} ${val}`)
        return val + 1
      })
    }
    const schema = makeSchema({
      outputs: false,
      types: [
        queryField('testCompose', {
          type: 'Int',
          resolve: async () => {
            calls.push('calls:resolver')
            return 1
          },
        }),
      ],
      plugins: [
        plugin({
          name: 'a',
          onCreateFieldResolver: testResolve('a'),
        }),
        plugin({
          name: 'b',
          onCreateFieldResolver: testResolve('b'),
        }),
        plugin({
          name: 'c',
          onCreateFieldResolver: testResolve('c'),
        }),
      ],
    })
    await graphql({
      schema,
      source: `
        {
          testCompose
        }
      `,
    })
    expect(calls).toMatchSnapshot()
  })
})
