import { GraphQLString } from 'graphql'
import { list, makeSchema, nonNull, nullable } from '../src'
import { AllNexusOutputTypeDefs, objectType, queryType } from '../src/core'

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

function getLabel(type: any, wraps: string[], nonNullDefault: boolean) {
  const endBrackets = wraps.length
  const typeName = typeof type === 'string' ? type : type.name
  // /!\ wraps is spread to prevent mutating the original
  const wrappingLabel = [...wraps].reverse().join('(') + '(' + typeName + ')'.repeat(endBrackets)

  return `${wrappingLabel} ; nonNullDefault=${nonNullDefault}`
}

const map: Record<string, any> = {
  nullable: (type) => nullable(type),
  nonNull: (type) => nonNull(type),
  list: (type) => list(type),
}

type GeneratedType = { type?: AllNexusOutputTypeDefs; error?: Error; wraps: string[]; label: string }

function genWrappedTypes(
  baseType: AllNexusOutputTypeDefs | string,
  params: { nonNullDefault: boolean }
): Array<GeneratedType> {
  const combinations = getCombinations(WRAPPER_NAMES)

  return combinations.map((combination) => {
    const label = getLabel(baseType, combination, params.nonNullDefault)

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

function testField(type: AllNexusOutputTypeDefs | string, params: { nonNullDefault: boolean }) {
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

function getTestData(baseType: any, params: { nonNullDefault: boolean }): Array<[string, string | Error]> {
  const wrappedTypes = genWrappedTypes(baseType, params)

  return wrappedTypes.map((wrappedType) => {
    if (wrappedType.error) {
      return [wrappedType.label, wrappedType.error]
    }

    const type = testField(wrappedType.type, params)

    return [wrappedType.label, type]
  })
}

describe('nonNullDefaults: { output: true }', () => {
  const stringReferenceTestData = getTestData('String', { nonNullDefault: true })
  const graphqlNativeTestData = getTestData(GraphQLString, { nonNullDefault: true })
  const nexusTypeDefTestData = getTestData(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: true }
  )

  it.each(stringReferenceTestData)('%s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(graphqlNativeTestData)('graphql native %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
})

describe('nonNullDefaults: { output: false }', () => {
  const stringReferenceTestData = getTestData('String', { nonNullDefault: false })
  const graphqlNativeTestData = getTestData(GraphQLString, { nonNullDefault: false })
  const nexusTypeDefTestData = getTestData(
    objectType({
      name: 'Foo',
      definition(t) {
        t.id('id')
      },
    }),
    { nonNullDefault: false }
  )

  it.each(stringReferenceTestData)('%s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(graphqlNativeTestData)('graphql native %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
  it.each(nexusTypeDefTestData)('nexus def %s', (_, typeOrError) => {
    expect(typeOrError).toMatchSnapshot()
  })
})
