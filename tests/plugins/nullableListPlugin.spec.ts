import { GraphQLInputObjectType } from 'graphql'
import { makeSchema, queryType } from '../../src'
import { inputObjectType, nullableListPlugin, SchemaConfig, stringArg } from '../../src/core'

function testOutputField(
  fieldConfig: { nullable?: boolean; list?: true | boolean[] },
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const schema = makeSchema({
    outputs: false,
    ...makeSchemaConfig,
    types: [
      queryType({
        definition(t) {
          t.string('foo', fieldConfig as any)
        },
      }),
    ],
    plugins: [nullableListPlugin()],
  })

  return schema.getQueryType()?.getFields()['foo']!.type
}

function testInputField(
  fieldConfig: { nullable?: boolean; list?: true | boolean[] },
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const schema = makeSchema({
    outputs: false,
    ...makeSchemaConfig,
    types: [
      queryType({
        definition(t) {
          t.string('ok')
        },
      }),
      inputObjectType({
        name: 'Foo',
        definition(t) {
          t.string('foo', fieldConfig as any)
        },
      }),
    ],
    plugins: [nullableListPlugin()],
  })

  const inputType = schema.getType('Foo') as GraphQLInputObjectType

  return inputType.getFields()['foo']?.type
}

function testArg(
  argConfig: { nullable?: boolean; list?: true | boolean[] },
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const schema = makeSchema({
    outputs: false,
    ...makeSchemaConfig,
    types: [
      queryType({
        definition(t) {
          t.string('foo', {
            args: {
              id: stringArg(argConfig as any),
            },
          })
        },
      }),
    ],
    plugins: [nullableListPlugin()],
  })

  return schema
    .getQueryType()
    ?.getFields()
    ['foo'].args.find((a) => a.name === 'id')!.type
}

function getListCombinations() {
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

function getTestData(kind: 'input' | 'output' | 'arg') {}

describe('output types ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testOutputField({
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testOutputField({
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testOutputField({
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testOutputField({
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testOutputField({
      list: comb,
      nullable: false,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testOutputField({
      list: comb,
      nullable: true,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('output types ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testOutputField(
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
    const field = testOutputField(
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
    const field = testOutputField(
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
    const field = testOutputField(
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

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testOutputField(
      {
        list: comb,
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testOutputField(
      {
        list: comb,
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('input types ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testInputField({
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testInputField({
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testInputField({
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testInputField({
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testInputField({
      list: comb,
      nullable: false,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testInputField({
      list: comb,
      nullable: true,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('input types ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testInputField(
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
    const field = testInputField(
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
    const field = testInputField(
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
    const field = testInputField(
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

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testInputField(
      {
        list: comb,
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testInputField(
      {
        list: comb,
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('arg def ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testArg({
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testArg({
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testArg({
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testArg({
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testArg({
      list: comb,
      nullable: false,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testArg({
      list: comb,
      nullable: true,
    })
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})

describe('arg def ; nonNullDefaults = true ;', () => {
  test('nullable: false', () => {
    const field = testArg(
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
    const field = testArg(
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
    const field = testArg(
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
    const field = testArg(
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

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testArg(
      {
        list: comb,
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableFalse)('%s ; nullable = false', (_, field) => {
    expect(field).toMatchSnapshot()
  })

  const testDataNullableTrue = getListCombinations().map((comb) => {
    const field = testArg(
      {
        list: comb,
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )
    const label = `[${comb.join(',')}]`

    return [label, field]
  })

  it.each(testDataNullableTrue)('%s ; nullable = true', (_, field) => {
    expect(field).toMatchSnapshot()
  })
})
