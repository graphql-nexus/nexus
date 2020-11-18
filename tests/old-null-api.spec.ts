import { makeSchema, queryType } from '../src'
import { ScalarOutConfig, SchemaConfig } from '../src/core'

function testField(
  fieldConfig: ScalarOutConfig<any, any>,
  makeSchemaConfig: Omit<SchemaConfig, 'types'> = {}
) {
  const schema = makeSchema({
    outputs: false,
    ...makeSchemaConfig,
    types: [
      queryType({
        definition(t) {
          t.string('foo', fieldConfig)
        },
      }),
    ],
  })

  return schema.getQueryType()?.getFields()['foo']!.type
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

describe('output types ; nonNullDefaults = false ;', () => {
  test('nullable: false', () => {
    const field = testField({
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })

  test('nullable: true', () => {
    const field = testField({
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"String"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField({
      list: true,
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String]"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField({
      list: true,
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  test('list: [true] ; nullable: true', () => {
    const field = testField({
      list: [true],
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]"`)
  })

  test('list: [true] ; nullable: false', () => {
    const field = testField({
      list: [true],
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  test('list: [true, true] ; nullable: true', () => {
    const field = testField({
      list: [true, true],
      nullable: true,
    })

    expect(field).toMatchInlineSnapshot(`"[[String!]!]"`)
  })

  test('list: [true, true] ; nullable: false', () => {
    const field = testField({
      list: [true, true],
      nullable: false,
    })

    expect(field).toMatchInlineSnapshot(`"[[String!]!]!"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testField({
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
    const field = testField({
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
    const field = testField(
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
      {
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"String!"`)
  })
  test('list: true ; nullable: true', () => {
    const field = testField(
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

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  test('list: true ; nullable: false', () => {
    const field = testField(
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

  test('list: [true] ; nullable: true', () => {
    const field = testField(
      {
        list: [true],
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[String!]!"`)
  })

  test('list: [true] ; nullable: false', () => {
    const field = testField(
      {
        list: [true],
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

  test('list: [true, true] ; nullable: true', () => {
    const field = testField(
      {
        list: [true, true],
        nullable: true,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[[String!]!]!"`)
  })

  test('list: [true, true] ; nullable: false', () => {
    const field = testField(
      {
        list: [true, true],
        nullable: false,
      },
      {
        nonNullDefaults: {
          output: true,
        },
      }
    )

    expect(field).toMatchInlineSnapshot(`"[[String!]!]!"`)
  })

  const testDataNullableFalse = getListCombinations().map((comb) => {
    const field = testField(
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
    const field = testField(
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
