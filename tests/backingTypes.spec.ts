import * as path from 'path'
import { core, enumType, makeSchema, objectType, queryType } from '../src'
import { A, B } from './_types'

const { TypegenPrinter, TypegenMetadata } = core

export enum TestEnum {
  A = 'a',
  B = 'b',
}

function getSchemaWithNormalEnums() {
  return makeSchema({
    types: [
      enumType({
        name: 'A',
        members: [A.ONE, A.TWO],
      }),
      queryType({
        definition(t) {
          t.field('a', { type: 'A' })
        },
      }),
    ],
    outputs: false,
  })
}

function getSchemaWithConstEnums() {
  return makeSchema({
    types: [
      enumType({
        name: 'B',
        members: [B.NINE, B.TEN],
      }),
      queryType({
        definition(t) {
          t.field('b', { type: 'B' })
        },
      }),
    ],
    outputs: false,
  })
}

describe('backingTypes', () => {
  let metadata: core.TypegenMetadata

  beforeEach(async () => {
    metadata = new TypegenMetadata({
      outputs: {
        typegen: path.join(__dirname, 'test-gen.ts'),
        schema: path.join(__dirname, 'test-gen.graphql'),
      },
      typegenAutoConfig: {
        sources: [
          {
            alias: 't',
            source: path.join(__dirname, '_types.ts'),
          },
        ],
      },
      contextType: {
        path: path.join(__dirname, '_types.ts'),
        name: 'TestContext',
      },
    })
  })

  it('can match backing types to regular enums', async () => {
    const schema = getSchemaWithNormalEnums()
    const typegenInfo = await metadata.getTypegenInfo(schema)
    const typegen = new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath: '',
    })

    expect(typegen.printEnumTypeMap()).toMatchSnapshot()
  })

  it('can match backing types for const enums', async () => {
    const schema = getSchemaWithConstEnums()
    const typegenInfo = await metadata.getTypegenInfo(schema)
    const typegen = new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath: '',
    })

    expect(typegen.printEnumTypeMap()).toMatchSnapshot()
  })
})

describe('rootTypings', () => {
  it('can import enum via rootTyping', async () => {
    const metadata = new TypegenMetadata({
      outputs: { typegen: null, schema: null },
    })
    const schema = makeSchema({
      types: [
        enumType({
          name: 'TestEnumType',
          members: TestEnum,
          rootTyping: {
            path: __filename,
            name: 'TestEnum',
          },
        }),
      ],
      outputs: false,
    })
    const typegenInfo = await metadata.getTypegenInfo(schema)
    const typegen = new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath: '',
    })
    expect(typegen.print()).toMatchSnapshot()
  })

  it('throws error if root typing path is not an absolute path', async () => {
    const metadata = new TypegenMetadata({
      outputs: { typegen: null, schema: null },
    })
    const someType = objectType({
      name: 'SomeType',
      rootTyping: {
        name: 'invalid',
        path: './fzeffezpokm',
      },
      definition(t) {
        t.id('id')
      },
    })

    const schema = makeSchema({
      types: [someType],
      outputs: false,
    })

    const typegenInfo = await metadata.getTypegenInfo(schema)
    const typegen = new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath: '',
    })

    expect(() => typegen.print()).toThrowErrorMatchingInlineSnapshot(
      `"Expected an absolute path or Node package for the root typing path of the type SomeType, saw ./fzeffezpokm"`
    )
  })

  it('throws error if root typing path does not exist', async () => {
    const metadata = new TypegenMetadata({
      outputs: { typegen: null, schema: null },
    })
    const someType = objectType({
      name: 'SomeType',
      rootTyping: {
        name: 'invalid',
        path: __dirname + '/invalid_path.ts',
      },
      definition(t) {
        t.id('id')
      },
    })

    const schema = makeSchema({
      types: [someType],
      outputs: false,
    })

    const typegenInfo = await metadata.getTypegenInfo(schema)
    const typegen = new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath: '',
    })

    try {
      typegen.print()
    } catch (e) {
      expect(e.message.replace(__dirname, '')).toMatchInlineSnapshot(
        `"Root typing path /invalid_path.ts for the type SomeType does not exist"`
      )
    }
  })
})
