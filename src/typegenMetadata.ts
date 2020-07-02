import { GraphQLSchema, lexicographicSortSchema, printSchema } from 'graphql'
import path from 'path'
import { BuilderConfig, TypegenInfo } from './builder'
import { NexusGraphQLSchema } from './definitions/_types'
import { SDL_HEADER, TYPEGEN_HEADER } from './lang'
import { typegenAutoConfig } from './typegenAutoConfig'
import { TypegenFormatFn, typegenFormatPrettier } from './typegenFormatPrettier'
import { TypegenPrinter } from './typegenPrinter'

export interface TypegenMetadataConfig extends Omit<BuilderConfig, 'outputs' | 'shouldGenerateArtifacts'> {
  nexusSchemaImportId?: string
  outputs: {
    schema: false | string
    typegen: false | string
  }
}

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 */
export class TypegenMetadata {
  constructor(protected config: TypegenMetadataConfig) {}

  /**
   * Generates the artifacts of the build based on what we
   * know about the schema and how it was defined.
   */
  async generateArtifacts(schema: NexusGraphQLSchema) {
    const sortedSchema = this.sortSchema(schema)
    if (this.config.outputs.schema || this.config.outputs.typegen) {
      const { schemaTypes, tsTypes } = await this.generateArtifactContents(
        sortedSchema,
        this.config.outputs.typegen
      )
      if (this.config.outputs.schema) {
        await this.writeFile('schema', schemaTypes, this.config.outputs.schema)
      }
      if (this.config.outputs.typegen) {
        await this.writeFile('types', tsTypes, this.config.outputs.typegen)
      }
    }
  }

  async generateArtifactContents(schema: NexusGraphQLSchema, typeFilePath: string | false) {
    const [schemaTypes, tsTypes] = await Promise.all([
      this.generateSchemaFile(schema),
      typeFilePath ? this.generateTypesFile(schema, typeFilePath) : '',
    ])
    return { schemaTypes, tsTypes }
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
      // https://github.com/prisma-labs/nexus/issues/247.
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

  /**
   * Generates the schema, adding any directives as necessary
   */
  generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = this.config.customPrintSchemaFn
      ? this.config.customPrintSchemaFn(schema)
      : printSchema(schema)
    return [SDL_HEADER, printedSchema].join('\n\n')
  }

  /**
   * Generates the type definitions
   */
  async generateTypesFile(schema: NexusGraphQLSchema, typegenFile: string): Promise<string> {
    return new TypegenPrinter(schema, {
      ...(await this.getTypegenInfo(schema)),
      typegenFile,
    }).print()
  }

  async getTypegenInfo(schema: GraphQLSchema): Promise<TypegenInfo> {
    if (this.config.typegenConfig) {
      if (this.config.typegenAutoConfig) {
        console.warn(
          `Only one of typegenConfig and typegenAutoConfig should be specified, ignoring typegenConfig`
        )
      }
      return this.config.typegenConfig(schema, this.config.outputs.typegen || '')
    }

    if (this.config.typegenAutoConfig) {
      return typegenAutoConfig(this.config.typegenAutoConfig)(schema, this.config.outputs.typegen || '')
    }

    return {
      nexusSchemaImportId: this.config.nexusSchemaImportId,
      headers: [TYPEGEN_HEADER],
      imports: [],
      contextType: 'any',
      backingTypeMap: {},
    }
  }
}
