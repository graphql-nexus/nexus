/// <reference types="jest" />
import {
  GraphQLEnumType,
  GraphQLSchema,
  GraphQLObjectType,
  lexicographicSortSchema,
  printSchema,
  printType,
} from 'graphql'
import { enumType, extendInputType, extendType, idArg, inputObjectType, makeSchema, objectType } from '../src'
import { list } from '../src/definitions/list'
import { nonNull } from '../src/definitions/nonNull'
import { PostObject, UserObject } from './__helpers'

type TypeMap = ReturnType<GraphQLSchema['getTypeMap']>

enum NativeColors {
  RED = 'RED',
  BLUE = 'BLUE',
  GREEN = 'green', // lower case to ensure we grab correct keys
}

enum NativeNumbers {
  ONE = 1,
  TWO = 2,
  THREE = 3,
}

const buildTypes = <T extends TypeMap = any>(types: any) => {
  return makeSchema({
    types,
    outputs: false,
  }).getTypeMap() as T
}

describe('enumType', () => {
  it('builds an enum', () => {
    const PrimaryColors = enumType({
      name: 'PrimaryColors',
      members: ['RED', 'YELLOW', 'BLUE'],
    })
    const typeMap = buildTypes<{ PrimaryColors: GraphQLEnumType }>([PrimaryColors])
    expect(typeMap.PrimaryColors).toBeInstanceOf(GraphQLEnumType)
    expect(typeMap.PrimaryColors.getValues().map((v) => v.value)).toEqual(['RED', 'YELLOW', 'BLUE'])
  })

  it('builds an enum from a TypeScript enum with string values', () => {
    const Colors = enumType({
      name: 'Colors',
      members: NativeColors,
    })
    const typeMap = buildTypes<{ Colors: GraphQLEnumType }>([Colors])

    expect(typeMap.Colors).toBeInstanceOf(GraphQLEnumType)
    expect(typeMap.Colors.getValues()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'RED',
          value: 'RED',
        }),
        expect.objectContaining({
          name: 'BLUE',
          value: 'BLUE',
        }),
        expect.objectContaining({
          name: 'GREEN',
          value: 'green',
        }),
      ])
    )
  })

  it('builds an enum from a TypeScript enum with number values', () => {
    const Numbers = enumType({
      name: 'Numbers',
      members: NativeNumbers,
    })
    const typeMap = buildTypes<{ Numbers: GraphQLEnumType }>([Numbers])

    expect(typeMap.Numbers).toBeInstanceOf(GraphQLEnumType)
    expect(typeMap.Numbers.getValues()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'ONE',
          value: 1,
        }),
        expect.objectContaining({
          name: 'TWO',
          value: 2,
        }),
        expect.objectContaining({
          name: 'THREE',
          value: 3,
        }),
      ])
    )
  })

  it('can map internal values', () => {
    const Internal = enumType({
      name: 'Internal',
      members: [
        { name: 'A', value: '--A--' },
        { name: 'B', value: '--B--' },
      ],
    })
    const typeMap = buildTypes<{ Internal: GraphQLEnumType }>([Internal])
    expect(typeMap.Internal.getValues().map((v) => v.name)).toEqual(['A', 'B'])
    expect(typeMap.Internal.getValues().map((v) => v.value)).toEqual(['--A--', '--B--'])
  })

  it('has object syntax for enum mapping', () => {
    const MappedObj = enumType({
      name: 'MappedObj',
      members: {
        a: 1,
        b: 2,
      },
    })
    const typeMap = buildTypes<{
      MappedObj: GraphQLEnumType
    }>([MappedObj])
    expect(typeMap.MappedObj.getValues().map((v) => v.name)).toEqual(['a', 'b'])
    expect(typeMap.MappedObj.getValues().map((v) => v.value)).toEqual([1, 2])
  })

  it('throws if the enum has no members', () => {
    expect(() => {
      const NoMembers = enumType({
        name: 'NoMembers',
        members: [],
      })
      const typeMap = buildTypes<{ NoMembers: GraphQLEnumType }>([NoMembers])
      expect(typeMap.NoMembers.getValues()).toHaveLength(0)
    }).toThrow('must have at least one member')
  })

  it('can alias as a nexus method', () => {
    const out = objectType({
      name: 'Out',
      definition(t) {
        // @ts-ignore
        t.abc('outAbc')
      },
    })
    const input = inputObjectType({
      name: 'Input',
      definition(t) {
        // @ts-ignore
        t.abc('inAbc')
      },
    })

    const schema = makeSchema({
      types: [
        out,
        input,
        enumType({
          name: 'ABC',
          members: ['one', 'two', 'three'],
          asNexusMethod: 'abc',
        }),
      ],
    })
    expect(printSchema(lexicographicSortSchema(schema)).trim()).toMatchSnapshot()
  })
})

describe('objectType', () => {
  it('should build an object type', () => {
    const Account = objectType({
      name: 'Account',
      definition(t) {
        t.id('id', { description: 'The ID of the account' })
        t.string('name', { description: 'Holder of the account' })
        t.string('email', {
          description: 'The email of the person whos account this is',
        })
        t.field('nestedList', { type: list(nonNull(list('String'))) })
        t.field({ name: 'nestedList2', type: list(nonNull(list('String'))) })
      },
    })
    const typeMap = buildTypes<{ Account: GraphQLObjectType }>([Account])
    const fields = typeMap.Account.getFields()
    expect(Object.keys(fields).sort()).toEqual(['email', 'id', 'name', 'nestedList', 'nestedList2'])
    expect(fields.nestedList.type.toString()).toEqual('[[String]!]')
    expect(fields.nestedList2.type.toString()).toEqual('[[String]!]')
  })
})

describe('extendType', () => {
  it('should allow adding types to the Query type', () => {
    const GetUser = extendType({
      type: 'Query',
      definition(t) {
        t.field('user', { type: 'User', args: { id: idArg() } })
        t.field({ name: 'user2', type: 'User', args: { id: idArg() } })
      },
    })
    const GetPost = extendType({
      type: 'Query',
      definition(t) {
        t.field('post', { type: PostObject })
        t.field({ name: 'post2', type: PostObject })
      },
    })
    expect(
      Object.keys(
        buildTypes<{ Query: GraphQLObjectType }>([GetUser, GetPost, PostObject, UserObject]).Query.getFields()
      )
    ).toMatchSnapshot()
  })
})

describe('inputObjectType', () => {
  it('should output lists properly, #33', () => {
    const buildTypesMap = buildTypes([
      inputObjectType({
        name: 'ExtraBasketInput',
        definition(t) {
          t.string('foo')
        },
      }),
      inputObjectType({
        name: 'AddToBasketInput',
        definition(t) {
          t.list.field('extras', { type: 'ExtraBasketInput' })
          t.list.field({ name: 'extras2', type: 'ExtraBasketInput' })
        },
      }),
    ])
    expect(printType(buildTypesMap.AddToBasketInput)).toMatchSnapshot()
  })
})

describe('extendInputType', () => {
  it('should allow extending input objects', () => {
    const buildTypesMap = buildTypes([
      inputObjectType({
        name: 'InputTest',
        definition(t) {
          t.string('hello')
        },
      }),
      extendInputType({
        type: 'InputTest',
        definition(t) {
          t.string('world')
        },
      }),
    ])
    expect(printType(buildTypesMap.InputTest)).toMatchSnapshot()
  })
})
