/// <reference path="../_setup.ts" />
import { join, relative } from 'path'
import { core } from '../../src'
import { BuilderConfigInput } from '../../src/core'

const { generateSchema, typegenFormatPrettier } = core

type HookSettings = {
  rootDir: string
  config?: Partial<BuilderConfigInput>
}

export async function generateTypegen(settings: HookSettings) {
  const projectDir = settings.rootDir

  const typegenModulePath = join(projectDir, '__typegen.ts')
  const sdlFilePath = join(projectDir, '__schema.graphql')
  const entrypointModulePath = join(projectDir, '__app.ts')
  const importPath = relative(projectDir, join(__dirname, '..', '..', 'src')).replace(/\\/g, '/')

  const entrypoint = require(entrypointModulePath)
  const { plugins, ...types } = entrypoint

  await generateSchema({
    types: types,
    outputs: {
      typegen: typegenModulePath,
      schema: sdlFilePath,
    },
    shouldGenerateArtifacts: true,
    plugins: plugins || [],
    async formatTypegen(source, type) {
      const prettierConfigPath = require.resolve('../../.prettierrc')
      const content = await typegenFormatPrettier(prettierConfigPath)(source, type)

      return content.replace("'nexus'", `'${importPath}'`)
    },
    features: {
      abstractTypeStrategies: {
        resolveType: true,
      },
    },
    ...(settings.config ?? {}),
  })

  return { typegenModulePath }
}

export function installGenerateTypegenHook(settings: HookSettings) {
  beforeAll(() => generateTypegen(settings))
}

type Settings = {
  rootDir: string
  name?: string
  typeCheckShouldSucceed?: boolean
}

/**
 * Test that the given app can be built by TypeScript without any type errors.
 *
 * - Nexus generateSchema will be run before TypeScript to ensure typegen is present. - By default looks for
 * an `__app.ts` entrypoint - All entrypoint exports are expected to be Nexus type definitions - Except the
 * optional export name "plugins" which is treated as an array of plugins for makeSchema - Outputs a
 * `__typegen.ts` typegen module - You must import the typegen module into your entrypoint module - If you
 * provide a `tsconfig.json` file in the root dir it will be used.
 */
export function testApp(settings: Settings & HookSettings) {
  const name = settings?.name ?? 'app'
  const rootDir = settings.rootDir
  const typeCheckShouldSucceed = settings.typeCheckShouldSucceed ?? true

  installGenerateTypegenHook(settings)

  it(`can compile ${name} app with its typegen`, async () => {
    if (typeCheckShouldSucceed) {
      expect({ rootDir }).toTypeCheck({
        outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      })
    } else {
      expect({ rootDir }).toNotTypeCheck({
        outDir: `/tmp/nexus-integration-test-${Date.now()}`,
      })
    }
  })
}
