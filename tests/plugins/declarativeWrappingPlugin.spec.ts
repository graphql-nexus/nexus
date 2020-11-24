import { GraphQLInputObjectType, GraphQLSchema } from 'graphql'
import { makeSchema, queryType } from '../../src'
import { arg, inputObjectType, declarativeWrappingPlugin, SchemaConfig } from '../../src/core'

type InputOutputFieldConfig = {
  nullable?: boolean
  list?: true | boolean[]
  type?: any
  useDotListShorthand?: boolean
}

const TEST_DATA = {
  output: (config: InputOutputFieldConfig) => ({
    types: [
      queryType({
        definition(t) {
          if (config.useDotListShorthand) {
            t.list.field('foo', { ...config, type: config.type ?? 'String' })
          } else {
            t.field('foo', { ...config, type: config.type ?? 'String' })
          }
        },
      }),
    ],
    getTypeFromSchema(schema: GraphQLSchema) {
      return schema.getQueryType()?.getFields()['foo']!.type
    },
  }),
  input: (config: InputOutputFieldConfig) => ({
    types: [
      queryType({
        definition(t) {
          t.string('ok')
        },
      }),
      inputObjectType({
        name: 'Foo',
        definition(t) {
          if (config.useDotListShorthand) {
            t.list.field('foo', { ...config, type: config.type ?? 'String' })
          } else {
            t.field('foo', { ...config, type: config.type ?? 'String' })
          }
        },
      }),
    ],
    getTypeFromSchema(schema: GraphQLSchema) {
      const inputType = schema.getType('Foo') as GraphQLInputObjectType

      return inputType.getFields()['foo']?.type
    },
  }),
  arg: (config: Omit<InputOutputFieldConfig, 'useDotListShorthand'> & { required?: boolean }) => ({
    types: [
      queryType({
        definition(t) {
          t.string('foo', {
            args: {
              id: arg({ ...config, type: config.type ?? 'String' }),
            },
          })
        },
      }),
    ],
    getTypeFromSchema(schema: GraphQLSchema) {
      return schema
        .getQueryType()
        ?.getFields()
        ['foo'].args.find((a) => a.name === 'id')!.type
    },
  }),
}

const getListCombinations = () => {
  const dataset = [true, false]
  const output: Array<boolean[]> = []

  for (const a of dataset) {
    output.push([a])
    for (const b of dataset) {
      output.push([a, b])
      for (const c of dataset) {
        output.push([a, b, c])
      }
    }
  }

  return output
}

const LIST_COMBINATIONS = getListCombinations()

function testField<Kind extends keyof typeof TEST_DATA>(
  kind: Kind,
  config: Parameters<typeof TEST_DATA[Kind]>[0],
  schemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const { types, getTypeFromSchema } = TEST_DATA[kind](config)

  const schema = makeSchema({
    outputs: false,
    types,
    plugins: [declarativeWrappingPlugin()],
    ...schemaConfig,
  })

  return getTypeFromSchema(schema)
}

function genTestData<Kind extends keyof typeof TEST_DATA>(
  kind: Kind,
  schemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const gen = (kind: Kind, config: { nullable: boolean }) =>
    LIST_COMBINATIONS.map((comb) => {
      const field = testField(kind, { list: comb, nullable: config.nullable }, schemaConfig)
      const label = `[${comb.join(',')}]`

      return [label, field]
    })

  return {
    nonNull: gen(kind, { nullable: false }),
    nullable: gen(kind, { nullable: true }),
  }
}

const OUTPUT_TYPES_NON_NULL_DEFAULTS_TRUE = genTestData('output', { nonNullDefaults: { output: true } })
const OUTPUT_TYPES_NON_NULL_DEFAULTS_FALSE = genTestData('output', { nonNullDefaults: { output: false } })

const INPUT_TYPES_NON_NULL_DEFAULTS_TRUE = genTestData('output', { nonNullDefaults: { input: true } })
const INPUT_TYPES_NON_NULL_DEFAULTS_FALSE = genTestData('output', { nonNullDefaults: { input: false } })

const ARG_DEF_NON_NULL_DEFAULTS_TRUE = genTestData('arg', { nonNullDefaults: { input: true } })
const ARG_DEF_NON_NULL_DEFAULTS_FALSE = genTestData('arg', { nonNullDefaults: { input: false } })

describe('output types ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testField('output', {
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField('output', {
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField('output', {
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField('output', {
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(OUTPUT_TYPES_NON_NULL_DEFAULTS_FALSE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(OUTPUT_TYPES_NON_NULL_DEFAULTS_FALSE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('output types ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testField(
      'output',
      {
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField(
      'output',
      {
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField(
      'output',
      {
        list: true,
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField(
      'output',
      {
        list: true,
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(OUTPUT_TYPES_NON_NULL_DEFAULTS_TRUE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(OUTPUT_TYPES_NON_NULL_DEFAULTS_TRUE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('input types ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testField('input', {
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField('input', {
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField('input', {
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField('input', {
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(INPUT_TYPES_NON_NULL_DEFAULTS_FALSE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(INPUT_TYPES_NON_NULL_DEFAULTS_FALSE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('input types ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testField(
      'input',
      {
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField(
      'input',
      {
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField(
      'input',
      {
        list: true,
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField(
      'input',
      {
        list: true,
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(INPUT_TYPES_NON_NULL_DEFAULTS_TRUE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(INPUT_TYPES_NON_NULL_DEFAULTS_TRUE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('arg def ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testField('arg', {
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField('arg', {
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })

  test('required: false', () => {
    const field = testField('arg', {
      required: false,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })

  test('required: true', () => {
    const field = testField('arg', {
      required: true,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('list: true ; nullable: true', () => {
    const field = testField('arg', {
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField('arg', {
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(ARG_DEF_NON_NULL_DEFAULTS_FALSE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(ARG_DEF_NON_NULL_DEFAULTS_FALSE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('arg def ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testField(
      'arg',
      {
        nullable: false,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField(
      'arg',
      {
        nullable: true,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String"`)
  })

  test('required: false', () => {
    const field = testField(
      'arg',
      {
        required: false,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String"`)
  })

  test('required: true', () => {
    const field = testField(
      'arg',
      {
        required: true,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('list: true ; nullable: true', () => {
    const field = testField(
      'arg',
      {
        list: true,
        nullable: true,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField(
      'arg',
      {
        list: true,
        nullable: false,
      },
      {
        nonNullDefaults: {
          input: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  it.each(ARG_DEF_NON_NULL_DEFAULTS_TRUE.nonNull)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  it.each(ARG_DEF_NON_NULL_DEFAULTS_TRUE.nullable)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})
