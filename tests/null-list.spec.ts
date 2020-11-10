import { GraphQLString } from 'graphql'
import { list, makeSchema, nonNull, nullable } from '../src'
import {
  AllNexusArgsDefs,
  AllNexusOutputTypeDefs,
  arg,
  inputObjectType,
  objectType,
  queryType,
  stringArg,
} from '../src/core'

const WRAPPER_NAMES = ['list', 'nonNull', 'nullable']

function getCombinations(arr: string[]): Array<string[]> {
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

function getLabel(type: any, wraps: string[]) {
  const endBrackets = wraps.length
  const typeName = typeof type === 'string' ? type : type.name
  // /!\ wraps is spread to prevent mutating the original
  const wrappingLabel = [...wraps].reverse().join('(') + '(' + typeName + ')'.repeat(endBrackets)

  return wrappingLabel
}

const map: Record<string, any> = {
  nullable: (type: any) => nullable(type),
  nonNull: (type: any) => nonNull(type),
  list: (type: any) => list(type),
}

type GeneratedType = { type?: any; error?: Error; wraps: string[]; label: string }

function genWrappedTypes(baseType: AllNexusOutputTypeDefs | string): Array<GeneratedType> {
  const combinations = getCombinations(WRAPPER_NAMES)

  return combinations.map((combination) => {
    const label = getLabel(baseType, combination)

    try {
      return {
        type: combination.reduce((acc, fnName) => {
          return map[fnName](acc)
        }, baseType),
        wraps: combination,
        label,
      }
    } catch (e) {
      return {
        error: e,
        wraps: combination,
        label,
      }
    }
  })
}

function testField(type: AllNexusOutputTypeDefs | string, params: { nonNullDefault: boolean }): string {
  const schema = makeSchema({
    types: [
      queryType({
        definition(t) {
          t.field('foo', {
            type: type as any,
          })
        },
      }),
    ],
    nonNullDefaults: {
      output: params.nonNullDefault,
    },
    outputs: false,
  })

  return schema.getQueryType().getFields()['foo']!.type.toString()
}

function testArg(
  type: AllNexusArgsDefs,
  params: { nonNullDefault: boolean; wrappedInArg?: boolean }
): string {
  const schema = makeSchema({
    types: [
      queryType({
        definition(t) {
          t.field('foo', {
            args: {
              foo: params.wrappedInArg === true ? arg({ type: type as any }) : type,
            },
            type: 'String',
          })
        },
      }),
    ],
    nonNullDefaults: {
      output: params.nonNullDefault,
    },
    outputs: false,
  })

  return schema
    .getQueryType()
    .getFields()
    ['foo']!.args.find((a) => a.name === 'foo')!
    .type.toString()
}

function getTestDataForOutputType(
  baseType: any,
  params: { nonNullDefault: boolean }
): Array<[string, string | Error]> {
  const wrappedTypes = genWrappedTypes(baseType)

  return wrappedTypes.map((wrappedType) => {
    if (wrappedType.error) {
      return [wrappedType.label, wrappedType.error]
    }

    const outputType = testField(wrappedType.type, params)

    return [wrappedType.label, outputType]
  })
}

function getTestDataForInputType(
  baseType: any,
  params: { nonNullDefault: boolean; wrappedInArg?: boolean }
): Array<[string, string | Error]> {
  const wrappedTypes = genWrappedTypes(baseType)

  return wrappedTypes.map((wrappedType) => {
    if (wrappedType.error) {
      return [wrappedType.label, wrappedType.error]
    }

    const inputType = testArg(wrappedType.type, params)

    return [wrappedType.label, inputType]
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
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
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
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
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
  const wrappedArgDefTestData = getTestDataForInputType(stringArg(), { nonNullDefault: false })
  const argDefTestData = getTestDataForInputType('String', { nonNullDefault: false, wrappedInArg: true })

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(wrappedArgDefTestData)('wrapped arg def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })

  it.each(argDefTestData)('arg def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
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
  const wrappedArgDefTestData = getTestDataForInputType(stringArg(), { nonNullDefault: true })
  const argDefTestData = getTestDataForInputType('String', { nonNullDefault: true, wrappedInArg: true })

  it.each(stringReferenceTestData)('string ref %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(wrappedArgDefTestData)('wrapped arg def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })

  it.each(argDefTestData)('arg def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
})

describe('edges cases', () => {
  test('cannot wrap non nexus types', () => {
    expect(() => list(GraphQLString as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a type not constructed by Nexus in a list(). Saw String"`
    )
    expect(() => nonNull(GraphQLString as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a type not constructed by Nexus in a nonNull(). Saw String"`
    )
    expect(() => nullable(GraphQLString as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a type not constructed by Nexus in a nullable(). Saw String"`
    )
  })

  test('forbid nonNull(nonNull()), nullable(nullable()), nonNull(nullable()), nullable(nonNull())', () => {
    expect(() => nullable(nullable('String') as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a nullable() in a nullable()"`
    )
    expect(() => nonNull(nonNull('String') as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a nonNull() in a nonNull()"`
    )
    expect(() => nullable(nonNull('String') as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a nonNull() in a nullable()"`
    )
    expect(() => nonNull(nullable('String') as any)).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap a nullable() in a nonNull()"`
    )
  })

  test('cannot wrap at the same time an arg def and its type', () => {
    const type = list(arg({ type: list('String') }))

    expect(() => testArg(type, { nonNullDefault: false })).toThrowErrorMatchingInlineSnapshot(
      `"Cannot wrap arg() and \`type\` property in list() or nonNull() or nullable() at the same time"`
    )
  })
})
