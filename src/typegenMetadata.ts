import { GraphQLSchema, lexicographicSortSchema, printSchema } from 'graphql'
import * as path from 'path'
import type { BuilderConfigInput, TypegenInfo } from './builder'
import type { ConfiguredTypegen } from './core'
import type { NexusGraphQLSchema } from './definitions/_types'
import { SDL_HEADER, TYPEGEN_HEADER } from './lang'
import { typegenAutoConfig } from './typegenAutoConfig'
import { TypegenFormatFn, typegenFormatPrettier } from './typegenFormatPrettier'
import { TypegenPrinter } from './typegenPrinter'

export interface TypegenMetadataConfig
  extends Omit<BuilderConfigInput, 'outputs' | 'shouldGenerateArtifacts'> {
  nexusSchemaImportId?: string
  outputs: {
    schema: null | string
    typegen: null | ConfiguredTypegen
  }
}

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary field / type metadata we need to be aware
 * of when building the generated types and/or SDL artifact, including but not limited to:
 */
export class TypegenMetadata {
  constructor(protected config: TypegenMetadataConfig) {}

  /** Generates the artifacts of the build based on what we know about the schema and how it was defined. */
  async generateArtifacts(schema: NexusGraphQLSchema) {
    const sortedSchema = this.sortSchema(schema)
    const { typegen } = this.config.outputs
    if (this.config.outputs.schema || typegen) {
      const { schemaTypes, tsTypes, globalTypes } = await this.generateArtifactContents(sortedSchema, typegen)
      if (this.config.outputs.schema) {
        await this.writeFile('schema', schemaTypes, this.config.outputs.schema)
      }
      if (typegen) {
        if (typeof typegen === 'string') {
          await this.writeFile('types', tsTypes, typegen)
        } else {
          await this.writeFile('types', tsTypes, typegen.outputPath)
          if (typeof typegen.globalsPath === 'string') {
            await this.writeFile('types', globalTypes ?? '', typegen.globalsPath)
          }
        }
      }
    }
  }

  async generateArtifactContents(schema: NexusGraphQLSchema, typegen: string | null | ConfiguredTypegen) {
    const result = {
      schemaTypes: this.generateSchemaFile(schema),
      tsTypes: '',
      globalTypes: null as null | string,
    }
    if (!typegen) {
      return result
    }
    if (typeof typegen === 'string') {
      result.tsTypes = await this.generateTypesFile(schema, typegen)
    } else {
      const generateResult = await this.generateConfiguredTypes(schema, typegen)
      result.tsTypes = generateResult.tsTypes
      result.globalTypes = generateResult.globalTypes
    }
    return result
  }

  sortSchema(schema: NexusGraphQLSchema) {
    let sortedSchema = schema
    if (typeof lexicographicSortSchema !== 'undefined') {
      sortedSchema = lexicographicSortSchema(schema) as NexusGraphQLSchema
    }
    return sortedSchema
  }

  async writeFile(type: 'schema' | 'types', output: string, filePath: string) {
    if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) {
      return Promise.reject(
        new Error(`Expected an absolute path to output the Nexus ${type}, saw ${filePath}`)
      )
    }
    const fs = require('fs') as typeof import('fs')
    const util = require('util') as typeof import('util')
    const [readFile, writeFile, removeFile, mkdir] = [
      util.promisify(fs.readFile),
      util.promisify(fs.writeFile),
      util.promisify(fs.unlink),
      util.promisify(fs.mkdir),
    ]
    let formatTypegen: TypegenFormatFn | null = null
    if (typeof this.config.formatTypegen === 'function') {
      formatTypegen = this.config.formatTypegen
    } else if (this.config.prettierConfig) {
      formatTypegen = typegenFormatPrettier(this.config.prettierConfig)
    }
    const content = typeof formatTypegen === 'function' ? await formatTypegen(output, type) : output
    const [toSave, existing] = await Promise.all([content, readFile(filePath, 'utf8').catch(() => '')])
    if (toSave !== existing) {
      const dirPath = path.dirname(filePath)
      try {
        await mkdir(dirPath, { recursive: true })
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e
        }
      }
      // VSCode reacts to file changes better if a file is first deleted,
      // apparently. See issue motivating this logic here:
      // https://github.com/graphql-nexus/schema/issues/247.
      try {
        await removeFile(filePath)
      } catch (e) {
        /* istanbul ignore next */
        if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') {
          throw e
        }
      }
      return writeFile(filePath, toSave)
    }
  }

  /** Generates the schema, adding any directives as necessary */
  generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = this.config.customPrintSchemaFn
      ? this.config.customPrintSchemaFn(schema)
      : printSchema(schema)
    return [SDL_HEADER, printedSchema].join('\n\n')
  }

  /** Generates the type definitions */
  async generateTypesFile(schema: NexusGraphQLSchema, typegenPath: string): Promise<string> {
    const typegenInfo = await this.getTypegenInfo(schema, typegenPath)

    return new TypegenPrinter(schema, {
      declareInputs: false,
      ...typegenInfo,
      typegenPath,
    }).print()
  }

  /** Generates the type definitions */
  async generateConfiguredTypes(schema: NexusGraphQLSchema, typegen: ConfiguredTypegen) {
    const { outputPath: typegenPath, globalsPath, globalsHeaders, declareInputs = false } = typegen
    const typegenInfo = await this.getTypegenInfo(schema, typegenPath)

    return new TypegenPrinter(schema, {
      ...typegenInfo,
      typegenPath,
      globalsPath,
      globalsHeaders,
      declareInputs,
    }).printConfigured()
  }

  async getTypegenInfo(schema: GraphQLSchema, typegenPath?: string): Promise<TypegenInfo> {
    if ('typegenConfig' in this.config) {
      throw new Error(
        'Error: typegenConfig was removed from the API. Please open an issue if you were using it.'
      )
    }

    if (this.config.sourceTypes) {
      return typegenAutoConfig(this.config.sourceTypes, this.config.contextType)(
        schema,
        typegenPath || this.config.outputs.typegen?.outputPath || ''
      )
    }

    return {
      nexusSchemaImportId: this.config.nexusSchemaImportId,
      headers: [TYPEGEN_HEADER],
      imports: [],
      contextTypeImport: this.config.contextType,
      sourceTypeMap: {},
    }
  }
}
