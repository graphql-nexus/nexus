import { buildSchema } from 'graphql'
import * as path from 'path'
import { core } from '../src'
import { generateSchema, NexusGraphQLSchema, typegenFormatPrettier } from '../src/core'
import { EXAMPLE_SDL } from './_sdl'

const { TypegenPrinter, TypegenMetadata } = core

describe('typegenPrinter: globals', () => {
  let typegen: core.TypegenPrinter
  let metadata: core.TypegenMetadata
  beforeEach(async () => {
    const outputs = {
      typegen: {
        outputPath: path.join(__dirname, 'typegen-globals/types.gen.ts'),
        globalsPath: path.join(__dirname, 'typegen-globals/global-types.gen.ts'),
        declareInputs: true,
      },
      schema: path.join(__dirname, 'typegen-globals/schema.gen.graphql'),
    } as const

    const schema = await generateSchema({
      outputs,
      shouldGenerateArtifacts: true,
      types: [buildSchema(EXAMPLE_SDL)],
      // __typename put to true to prevent from erroring because of missing resolveType
      features: {
        abstractTypeStrategies: {
          __typename: true,
        },
      },
      async formatTypegen(source, type) {
        const prettierConfigPath = require.resolve('../.prettierrc')
        const content = await typegenFormatPrettier(prettierConfigPath)(source, type)

        return content.replace("'nexus'", `'../../src'`)
      },
    })

    metadata = new TypegenMetadata({
      outputs,
      sourceTypes: {
        modules: [
          {
            module: path.join(__dirname, '__helpers/index.ts'),
            alias: 't',
          },
        ],
        mapping: {
          UUID: 'string',
        },
      },
      contextType: {
        module: path.join(__dirname, '__helpers/index.ts'),
        export: 'TestContext',
      },
    })

    const typegenInfo = await metadata.getTypegenInfo(schema)

    const { outputPath, ...rest } = outputs.typegen

    typegen = new TypegenPrinter(metadata.sortSchema(schema), {
      ...typegenInfo,
      ...rest,
      typegenPath: outputPath,
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should print the full output', () => {
    expect(typegen.printConfigured()).toMatchSnapshot()
  })
})

describe('typegenPrinter: no input changes', () => {
  let out: {
    schema: NexusGraphQLSchema
    schemaTypes: string
    tsTypes: string
    globalTypes: string | null
  }
  beforeEach(async () => {
    const typegen = {
      outputPath: path.join(__dirname, 'typegen-globals/types.gen.ts'),
      globalsPath: path.join(__dirname, 'typegen-globals/global-types.gen.ts'),
    } as const
    out = await generateSchema.withArtifacts(
      {
        outputs: {
          typegen,
          schema: path.join(__dirname, 'typegen-globals/schema.gen.graphql'),
        },
        shouldGenerateArtifacts: true,
        types: [buildSchema(EXAMPLE_SDL)],
        // __typename put to true to prevent from erroring because of missing resolveType
        features: {
          abstractTypeStrategies: {
            __typename: true,
          },
        },
      },
      typegen
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should print the full output, with inputs', () => {
    expect(out.tsTypes).toMatchSnapshot()
    expect(out.globalTypes).toMatchSnapshot()
  })
})
