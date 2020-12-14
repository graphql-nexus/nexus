import { GraphQLArgument, GraphQLInputObjectType, GraphQLInputType, GraphQLOutputType } from 'graphql'
import { list, makeSchema, nonNull, nullable } from '../src'
import { arg, inputObjectType, objectType, queryType, stringArg } from '../src/core'

const WRAPPER_NAMES = ['list', 'nonNull', 'nullable']

function getWrappings(arr: string[]): Array<string[]> {
  const output: Array<string[]> = []

  for (const elem1 of arr) {
    output.push([elem1])

    for (const elem2 of arr) {
      output.push([elem1, elem2])

      for (const elem3 of arr) {
        output.push([elem1, elem2, elem3])
      }
    }
  }

  return Object.values(output)
}

const WRAPPINGS = getWrappings(WRAPPER_NAMES)

function getLabel(type: any, wrapping: string[], isChaining = false) {
  const endBrackets = wrapping.length
  const typeName = typeof type === 'string' ? type : type.name
  // /!\ wraps is spread to prevent mutating the original
  const wrappingLabel = [...wrapping].reverse().join('(') + '(' + typeName + ')'.repeat(endBrackets)

  if (isChaining) {
    return `${[...wrapping].join('.')}.field({type: ${typeName}})`
  }

  return wrappingLabel
}

const wrapperNameToWrapper: Record<string, any> = {
  nullable: (type: any) => nullable(type),
  nonNull: (type: any) => nonNull(type),
  list: (type: any) => list(type),
}

function wrapType(baseType: any, wrapping: string[]): any {
  return wrapping.reduce((type, wrapperName) => {
    return wrapperNameToWrapper[wrapperName](type)
  }, baseType)
}

function testOutputField(
  baseType: string | object,
  wrapping: string[],
  params: { nonNullDefault: boolean; useChainingApi?: boolean }
) {
  const schema = makeSchema({
    types: [
      queryType({
        definition(t) {
          if (params.useChainingApi) {
            t = getChainedT(t, wrapping)
          }

          t.field('foo', {
            type: params.useChainingApi ? baseType : wrapType(baseType, wrapping),
          })
        },
      }),
    ],
    nonNullDefaults: {
      output: params.nonNullDefault,
    },
    outputs: false,
  })

  return schema.getQueryType()!.getFields()['foo']!.type
}

function testInputField(
  baseType: string | object,
  wrapping: string[],
  params: { nonNullDefault: boolean; useChainingApi?: boolean }
) {
  const schema = makeSchema({
    types: [
      inputObjectType({
        name: 'Bar',
        definition(t) {
          if (params.useChainingApi) {
            t = getChainedT(t, wrapping)
          }

          t.field('foo', {
            type: params.useChainingApi ? baseType : wrapType(baseType, wrapping),
          })
        },
      }),
    ],
    nonNullDefaults: {
      input: params.nonNullDefault,
    },
    outputs: false,
  })

  return (schema.getType('Bar') as GraphQLInputObjectType).getFields()['foo']!.type
}

function testArg(
  type: string | object,
  wrapping: string[],
  params: { nonNullDefault: boolean; wrappedInArg?: boolean }
): GraphQLArgument {
  const schema = makeSchema({
    types: [
      queryType({
        definition(t) {
          const wrappedArgType = wrapType(type, wrapping)

          t.field('foo', {
            args: {
              foo: params.wrappedInArg === true ? arg({ type: wrappedArgType }) : wrappedArgType,
            },
            type: 'String',
          })
        },
      }),
    ],
    nonNullDefaults: {
      input: params.nonNullDefault,
    },
    outputs: false,
  })

  return schema
    .getQueryType()!
    .getFields()
    ['foo']!.args.find((a) => a.name === 'foo')!
}

function getChainedT(t: any, wrapping: string[]) {
  return wrapping.reduce((acc, wrapKind) => {
    return acc[wrapKind]
  }, t)
}

function getTestDataForOutputType(
  baseType: string | object,
  params: { nonNullDefault: boolean; useChainingApi?: boolean }
): Array<[string, GraphQLOutputType | Error]> {
  return WRAPPINGS.map((wrapping) => {
    const label = getLabel(baseType, wrapping, params.useChainingApi)
    try {
      const outputType = testOutputField(baseType, wrapping, params)

      return [label, outputType]
    } catch (e) {
      return [label, e]
    }
  })
}

function getTestDataForInputType(
  baseType: string | object,
  params: { nonNullDefault: boolean; useChainingApi?: boolean }
): Array<[string, GraphQLInputType | Error]> {
  return WRAPPINGS.map((wrapping) => {
    const label = getLabel(baseType, wrapping, params.useChainingApi)
    try {
      const outputType = testInputField(baseType, wrapping, params)

      return [label, outputType]
    } catch (e) {
      return [label, e]
    }
  })
}

function getTestDataForArgType(
  baseType: string | object,
  params: { nonNullDefault: boolean; wrappedInArg?: boolean }
): Array<[string, GraphQLInputType | Error]> {
  return WRAPPINGS.map((wrapping) => {
    const label = getLabel(baseType, wrapping)
    try {
      const arg = testArg(baseType, wrapping, params)

      return [label, arg.type]
    } catch (e) {
      return [label, e]
    }
  })
}

describe('wrapping for output types; nonNullDefault = true;', () => {
  const stringReferenceTestData = getTestDataForOutputType('String', { nonNullDefault: true })
  const nexusTypeDefTestData = getTestDataForOutputType(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for output types; nonNullDefault = false;', () => {
  const stringReferenceTestData = getTestDataForOutputType('String', { nonNullDefault: false })
  const nexusTypeDefTestData = getTestDataForOutputType(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for output types with chained API; nonNullDefault = true;', () => {
  const stringReferenceTestData = getTestDataForOutputType('String', {
    nonNullDefault: true,
    useChainingApi: true,
  })
  const nexusTypeDefTestData = getTestDataForOutputType(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true, useChainingApi: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for output types with chained API; nonNullDefault = false;', () => {
  const stringReferenceTestData = getTestDataForOutputType('String', {
    nonNullDefault: true,
    useChainingApi: true,
  })
  const nexusTypeDefTestData = getTestDataForOutputType(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false, useChainingApi: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for input types; nonNullDefault = true;', () => {
  const stringReferenceTestData = getTestDataForInputType('String', { nonNullDefault: true })
  const nexusTypeDefTestData = getTestDataForInputType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for input types; nonNullDefault = false;', () => {
  const stringReferenceTestData = getTestDataForInputType('String', { nonNullDefault: false })
  const nexusTypeDefTestData = getTestDataForInputType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for input types with chained API; nonNullDefault = true;', () => {
  const stringReferenceTestData = getTestDataForInputType('String', {
    nonNullDefault: true,
    useChainingApi: true,
  })
  const nexusTypeDefTestData = getTestDataForInputType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true, useChainingApi: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for input types with chained API; nonNullDefault = false;', () => {
  const stringReferenceTestData = getTestDataForInputType('String', {
    nonNullDefault: true,
    useChainingApi: true,
  })
  const nexusTypeDefTestData = getTestDataForInputType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false, useChainingApi: true }
  )

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for args; nonNullDefault = false;', () => {
  const stringReferenceTestData = getTestDataForArgType('String', { nonNullDefault: false })
  const nexusTypeDefTestData = getTestDataForArgType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false }
  )
  const wrappedArgDefTestData = getTestDataForArgType(stringArg(), { nonNullDefault: false })
  const argDefTestData = getTestDataForArgType('String', { nonNullDefault: false, wrappedInArg: true })

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(wrappedArgDefTestData)('wrapped arg def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(argDefTestData)('arg def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('wrapping for args; nonNullDefault = true;', () => {
  const stringReferenceTestData = getTestDataForArgType('String', { nonNullDefault: true })
  const nexusTypeDefTestData = getTestDataForArgType(
    inputObjectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true }
  )
  const wrappedArgDefTestData = getTestDataForArgType(stringArg(), { nonNullDefault: true })
  const argDefTestData = getTestDataForArgType('String', { nonNullDefault: true, wrappedInArg: true })

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
  it.each(wrappedArgDefTestData)('wrapped arg def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })

  it.each(argDefTestData)('arg def %s', (_, typeOrError) => {
    expect(typeOrError.toString()).toMatchSnapshot()
  })
})

describe('edges cases', () => {
  test('wrapped arg def retains metadata description etc', () => {
    const wrappedArgDef = list(nonNull(stringArg({ description: 'Bonjour !', default: 'Au revoir!' })))
    const graphqlArg = testArg(wrappedArgDef, [], { nonNullDefault: false })

    expect(graphqlArg).toMatchInlineSnapshot(`
      Object {
        "astNode": undefined,
        "defaultValue": "Au revoir!",
        "description": "Bonjour !",
        "extensions": Object {
          "nexus": Object {},
        },
        "name": "foo",
        "type": "[String!]",
      }
    `)
  })
})
