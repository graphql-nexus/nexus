import type { BuilderConfigInput } from './builder'
import type { ConfiguredTypegen } from './core'
import { nodeImports } from './node'
import type { TypegenMetadataConfig } from './typegenMetadata'
import { assertAbsolutePath, getOwnPackage, isProductionStage } from './utils'

/** Normalizes the builder config into the config we need for typegen */
export function resolveTypegenConfig(config: BuilderConfigInput): TypegenMetadataConfig {
  const { outputs, shouldGenerateArtifacts = defaultShouldGenerateArtifacts(), ...rest } = config

  function getOutputPaths() {
    const defaultSDLFilePath = nodeImports().path.join(process.cwd(), 'schema.graphql')

    let typegenFilePath: ConfiguredTypegen | null = null
    let sdlFilePath: string | null = null

    if (outputs === undefined) {
      if (isProductionStage()) {
        sdlFilePath = defaultSDLFilePath
      }
    } else if (outputs === true) {
      sdlFilePath = defaultSDLFilePath
    } else if (typeof outputs === 'object') {
      if (outputs.schema === true) {
        sdlFilePath = defaultSDLFilePath
      } else if (typeof outputs.schema === 'string') {
        sdlFilePath = assertAbsolutePath(outputs.schema, 'outputs.schema')
      } else if (outputs.schema === undefined && isProductionStage()) {
      }
      // handle typegen configuration
      if (typeof outputs.typegen === 'string') {
        typegenFilePath = {
          outputPath: assertAbsolutePath(outputs.typegen, 'outputs.typegen'),
        }
      } else if (typeof outputs.typegen === 'object') {
        typegenFilePath = {
          ...outputs.typegen,
          outputPath: assertAbsolutePath(outputs.typegen.outputPath, 'outputs.typegen.outputPath'),
        } as ConfiguredTypegen
        if (outputs.typegen.globalsPath) {
          typegenFilePath.globalsPath = assertAbsolutePath(
            outputs.typegen.globalsPath,
            'outputs.typegen.globalsPath'
          )
        }
      }
    } else if (outputs !== false) {
      console.warn(
        `You should specify a configuration value for outputs in Nexus' makeSchema. ` +
          `Provide one to remove this warning.`
      )
    }
    return {
      typegenFilePath,
      sdlFilePath,
    }
  }

  return {
    ...rest,
    nexusSchemaImportId: getOwnPackage().name,
    outputs: {
      typegen: shouldGenerateArtifacts ? getOutputPaths().typegenFilePath : null,
      schema: shouldGenerateArtifacts ? getOutputPaths().sdlFilePath : null,
    },
  }
}

function defaultShouldGenerateArtifacts() {
  return Boolean(
    typeof process === 'object' && (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production')
  )
}
