import {
  arg,
  booleanArg,
  connectionPlugin,
  extendType,
  idArg,
  inputObjectType,
  intArg,
  interfaceType,
  list,
  mutationField,
  mutationType,
  nonNull,
  objectType,
  queryField,
  scalarType,
  unionType,
} from 'nexus'
import { connectionFromArray } from 'graphql-relay'
import _ from 'lodash'

const USERS_DATA = _.times(100, (i) => ({
  pk: i,
  id: `User: ${i}`,
  name: `Users Connection ${i}`,
}))

export const testArgs1 = {
  foo: idArg(),
}

export const testArgs2 = {
  bar: idArg(),
}

export const Mutation = mutationType({
  definition(t) {
    t.boolean('ok', { resolve: () => true })
  },
})

export const SomeMutationField = mutationField('someMutationField', () => ({
  type: Foo,
  args: {
    id: nonNull(idArg()),
  },
  resolve(root, args) {
    return { name: `Test${args.id}`, ok: true }
  },
}))

export const Bar = interfaceType({
  name: 'Bar',
  description: 'Bar description',
  resolveType(source) {
    return 'Foo'
  },
  definition(t) {
    t.boolean('ok', { deprecation: 'Not ok?' })
    t.boolean('argsTest', {
      args: {
        a: arg({
          type: 'InputType',
          default: {
            key: 'one',
            answer: 2,
          },
        }),
      },
      resolve(root, args) {
        return true
      },
    })
  },
})

export interface UnusedInterfaceTypeDef {
  ok: boolean
}

export const UnusedInterface = interfaceType({
  name: 'UnusedInterface',
  definition(t) {
    t.boolean('ok')
  },
  rootTyping: { name: 'UnusedInterfaceTypeDef', path: __filename },
})

export const Baz = interfaceType({
  name: 'Baz',
  resolveType() {
    return 'TestObj'
  },
  definition(t) {
    t.boolean('ok')
    t.field('a', {
      type: Bar,
      description: "'A' description",
    })
  },
})

export const TestUnion = unionType({
  name: 'TestUnion',
  resolveType() {
    return 'Foo'
  },
  definition(t) {
    t.members('Foo')
  },
})

export const TestObj = objectType({
  name: 'TestObj',
  node: (obj) => `TestObj:${obj.item}`,
  definition(t) {
    t.implements('Bar', Baz)
    t.string('item')
    t.modify('ok', {
      resolve(root, args, ctx, info) {
        return false
      },
    })
  },
})

export const Foo = objectType({
  name: 'Foo',
  definition(t) {
    t.implements('Bar')
    t.string('name')
  },
})

export const InputType = inputObjectType({
  name: 'InputType',
  definition(t) {
    t.field('key', { type: nonNull('String') })
    t.int('answer')
    t.field('nestedInput', { type: InputType2 })
  },
})

export const InputType2 = inputObjectType({
  name: 'InputType2',
  definition(t) {
    t.field('key', { type: nonNull('String') })
    t.int('answer')
    t.field('someDate', { type: nonNull('Date') })
  },
})

export const Query = objectType({
  name: 'Query',
  definition(t) {
    t.field('bar', {
      type: 'TestObj',
      resolve: () => ({ ok: true, item: 'test' }),
    })
    t.int('getNumberOrNull', {
      args: { a: nonNull(intArg()) },
      async resolve(_, { a }) {
        if (a > 0) {
          return a
        }
        return null
      },
    })

    t.string('asArgExample', {
      args: {
        testAsArg: nonNull(InputType.asArg()),
      },
      skipNullGuard: true, // just checking that this isn't a type error
      resolve: () => 'ok',
    })

    t.string('inputAsArgExample', {
      args: {
        testScalar: 'String',
        testInput: InputType,
      },
      resolve: () => 'ok',
    })

    t.string('inlineArgs', {
      args: {
        someArg: arg({
          type: inputObjectType({
            name: 'SomeArg',
            definition(i) {
              i.string('someField')
              i.field('arg', {
                type: inputObjectType({
                  name: 'NestedType',
                  definition(j) {
                    j.string('veryNested')
                  },
                }),
              })
            },
          }),
        }),
      },
      resolve: () => 'ok',
    })
    t.list.date('dateAsList', { resolve: () => [] })

    t.connectionField('booleanConnection', {
      type: 'Boolean',
      disableBackwardPagination: true,
      nodes() {
        return [true]
      },
    })

    t.nonNull.connectionField('deprecatedConnection', {
      type: 'Boolean',
      deprecation: 'Dont use this, use booleanConnection instead',
      nodes() {
        return [true]
      },
    })

    t.connectionField('guardedConnection', {
      type: 'Date',
      disableBackwardPagination: true,
      authorize() {
        return false
      },
      nodes() {
        return [new Date()]
      },
    })

    t.connectionField('usersConnectionNodes', {
      type: User,
      description: 'A connection with some user nodes',
      cursorFromNode(node, args, ctx, info, { index, nodes }) {
        if (args.last && !args.before) {
          const totalCount = USERS_DATA.length
          return `cursor:${totalCount - args.last! + index + 1}`
        }
        return connectionPlugin.defaultCursorFromNode(node, args, ctx, info, {
          index,
          nodes,
        })
      },
      nodes(root, args) {
        if (args.after) {
          return USERS_DATA.slice(Number(args.after) + 1)
        }
        if (args.last) {
          if (args.before) {
            const beforeNum = Number(args.before)
            return USERS_DATA.slice(Math.max(beforeNum - args.last, 0), beforeNum)
          } else {
            return USERS_DATA.slice(-args.last - 1)
          }
        }
        return USERS_DATA
      },
    })

    t.connectionField('usersConnectionResolve', {
      type: User,
      resolve(root, args) {
        const { edges, pageInfo } = connectionFromArray(USERS_DATA, args)
        // The typings are wrong in this package for hasNextPage & hasPreviousPage
        return {
          edges,
          pageInfo: {
            ...pageInfo,
            hasNextPage: Boolean(pageInfo.hasNextPage),
            hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
          },
        }
      },
    })

    t.connectionField('userConnectionForwardOnly', {
      type: User,
      disableBackwardPagination: true,
      resolve(root, args) {
        const { edges, pageInfo } = connectionFromArray(USERS_DATA, args)
        // The typings are wrong in this package for hasNextPage & hasPreviousPage
        return {
          edges,
          pageInfo: {
            ...pageInfo,
            hasNextPage: Boolean(pageInfo.hasNextPage),
            hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
          },
        }
      },
    })

    t.connectionField('userConnectionBackwardOnly', {
      type: User,
      disableForwardPagination: true,
      resolve(root, args) {
        const { edges, pageInfo } = connectionFromArray(USERS_DATA, args)
        // The typings are wrong in this package for hasNextPage & hasPreviousPage
        return {
          edges,
          pageInfo: {
            ...pageInfo,
            hasNextPage: Boolean(pageInfo.hasNextPage),
            hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
          },
        }
      },
    })
  },
})

export const userConnectionAdditionalArgs = queryField((t) => {
  t.connectionField('userConnectionAdditionalArgs', {
    type: User,
    disableBackwardPagination: true,
    additionalArgs: {
      isEven: booleanArg({
        description: 'If true, filters the users with an odd pk',
      }),
    },
    resolve(root, args) {
      let userData = USERS_DATA
      if (args.isEven) {
        userData = USERS_DATA.filter((u) => u.pk % 2 === 0)
      }
      const { edges, pageInfo } = connectionFromArray(userData, args)
      // The typings are wrong in this package for hasNextPage & hasPreviousPage
      return {
        edges,
        pageInfo: {
          ...pageInfo,
          hasNextPage: Boolean(pageInfo.hasNextPage),
          hasPreviousPage: Boolean(pageInfo.hasPreviousPage),
        },
      }
    },
  })
})

export const ComplexObject = objectType({
  name: 'ComplexObject',
  definition(t) {
    t.id('id', { complexity: 5 })
  },
})

export const complexQuery = queryField('complexQuery', {
  type: list('ComplexObject'),
  args: {
    count: nonNull(intArg()),
  },
  complexity: ({ args, childComplexity }) => args.count * childComplexity,
  resolve: () => [{ id: '1' }],
})

export const User = objectType({
  name: 'User',
  definition(t) {
    t.id('id')
    t.string('name')
  },
})

const someItem = objectType({
  name: 'SomeItem',
  definition(t) {
    t.id('id')
  },
})

export const MoreQueryFields = extendType({
  type: 'Query',
  definition(t) {
    t.field('extended', {
      type: someItem,
      resolve(root) {
        return { id: 'SomeID' }
      },
    })
    t.int('protectedField', {
      authorize: () => false,
      resolve: () => 1,
    })
  },
})

export const DateScalar = scalarType({
  name: 'Date',
  serialize: (value) => value.getTime(),
  parseValue: (value) => new Date(value),
  parseLiteral: (ast) => (ast.kind === 'IntValue' ? new Date(ast.value) : null),
  asNexusMethod: 'date',
  rootTyping: 'Date',
})

export const Node = interfaceType({
  name: 'Node',
  definition(t) {
    t.id('id', {
      resolve: () => `id`,
    })
    t.field('data', { type: Node })
  },
})

export const SomeNode = objectType({
  name: 'SomeNode',
  definition(t) {
    t.implements(Node)
    t.modify('id', {
      resolve: () => 'somenode',
    })
    t.modify('data', {
      type: SomeNode,
    })
  },
})
