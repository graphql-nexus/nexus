/// <reference path="../_setup.ts" />
import { join } from 'path'
import * as ts from 'typescript'
import { core } from '../../src'
const { generateSchema, typegenFormatPrettier } = core

const NO_OP = () => {}

export const testSchema = (
  name: string,
  additionalTests: (getSchema: () => core.NexusGraphQLSchema, getImported: () => any) => void = NO_OP
) => {
  let schema: core.NexusGraphQLSchema
  const typegenFilePath = join(__dirname, `_${name}.typegen.ts`)
  const imported = require(`./_${name}`)
  const { plugins, ...rest } = imported

  beforeAll(async () => {
    schema = await generateSchema({
      types: rest,
      outputs: {
        typegen: typegenFilePath,
        schema: false,
      },
      shouldGenerateArtifacts: true,
      plugins: plugins || [],
      async formatTypegen(source, type) {
        const content = await typegenFormatPrettier({
          trailingComma: 'es5',
          arrowParens: 'always',
        })(source, type)
        return content.replace('"@nexus/schema"', '"../.."')
      },
    })
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it(`can compile ${name} app with its typegen`, async () => {
    const appFilePath = join(__dirname, `./_${name}.ts`)
    expect([appFilePath]).toTypeCheck({
      sourceMap: false,
      downlevelIteration: true,
      noEmitOnError: true,
      esModuleInterop: true,
      strict: true,
      target: ts.ScriptTarget.ES5,
      outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      noErrorTruncation: false,
    })
  })

  additionalTests(
    () => schema,
    () => imported
  )
}
