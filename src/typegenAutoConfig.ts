import { GraphQLNamedType, GraphQLSchema, isOutputType } from 'graphql'
import * as path from 'path'
import type { TypegenInfo } from './builder'
import type { TypingImport } from './definitions/_types'
import { TYPEGEN_HEADER } from './lang'
import { getOwnPackage, log, objValues, relativePathTo, typeScriptFileExtension } from './utils'

/** Any common types / constants that would otherwise be circular-imported */
export const SCALAR_TYPES = {
  Int: 'number',
  String: 'string',
  ID: 'string',
  Float: 'number',
  Boolean: 'boolean',
}

export interface SourceTypeModule {
  /**
   * The module for where to look for the types. This uses the node resolution algorithm via require.resolve,
   * so if this lives in node_modules, you can just provide the module name otherwise you should provide the
   * absolute path to the file.
   */
  module: string
  /**
   * When we import the module, we use `import * as ____` to prevent conflicts. This alias should be a name
   * that doesn't conflict with any other types, usually a short lowercase name.
   */
  alias: string
  /**
   * Provides a custom approach to matching for the type
   *
   * If not provided, the default implementation is:
   *
   * (type) => [ new RegExp(`(?:interface|type|class|enum)\\s+(${type.name})\\W`, "g"), ]
   */
  typeMatch?: (type: GraphQLNamedType, defaultRegex: RegExp) => RegExp | RegExp[]
  /**
   * A list of typesNames or regular expressions matching type names that should be resolved by this import.
   * Provide an empty array if you wish to use the file for context and ensure no other types are matched.
   */
  onlyTypes?: (string | RegExp)[]
  /**
   * By default the import is configured `import * as alias from`, setting glob to false will change this to
   * `import alias from`
   */
  glob?: false
}

export interface SourceTypesConfigOptions {
  /** Any headers to prefix on the generated type file */
  headers?: string[]
  /**
   * Array of SourceTypeModule's to look in and match the type names against.
   *
   * @example
   *   modules: [
   *     { module: 'typescript', alias: 'ts' },
   *     { module: path.join(__dirname, '../sourceTypes'), alias: 'b' },
   *   ]
   */
  modules: SourceTypeModule[]
  /**
   * Types that should not be matched for a source type,
   *
   * By default this is set to ['Query', 'Mutation', 'Subscription']
   *
   * @example
   *   skipTypes: ['Query', 'Mutation', /(.*?)Edge/, /(.*?)Connection/]
   */
  skipTypes?: (string | RegExp)[]
  /**
   * If debug is set to true, this will log out info about all types found, skipped, etc. for the type
   * generation files. @default false
   */
  debug?: boolean
  /**
   * If provided this will be used for the source types rather than the auto-resolve mechanism above. Useful
   * as an override for one-off cases, or for scalar source types.
   */
  mapping?: Record<string, string>
}

/**
 * This is an approach for handling type definition auto-resolution. It is designed to handle the most common
 * cases, as can be seen in the examples / the simplicity of the implementation.
 *
 * If you wish to do something more complex, involving full AST parsing, etc, you can provide a different
 * function to the `typegenInfo` property of the `makeSchema` config.
 *
 * @param options
 */
export function typegenAutoConfig(options: SourceTypesConfigOptions, contextType: TypingImport | undefined) {
  return async (schema: GraphQLSchema, outputPath: string): Promise<TypegenInfo> => {
    const {
      headers,
      skipTypes = ['Query', 'Mutation', 'Subscription'],
      mapping: _sourceTypeMap,
      debug,
    } = options

    const typeMap = schema.getTypeMap()
    const typesToIgnore = new Set<string>()
    const typesToIgnoreRegex: RegExp[] = []
    const allImportsMap: Record<string, string> = {}
    const importsMap: Record<string, [string, boolean]> = {}

    const sourceTypeMap: Record<string, string> = {
      ...SCALAR_TYPES,
      ..._sourceTypeMap,
    }

    const forceImports = new Set(
      objValues(sourceTypeMap)
        .concat(typeof contextType === 'string' ? contextType || '' : '')
        .map((t) => {
          const match = t.match(/^(\w+)\./)
          return match ? match[1] : null
        })
        .filter((f) => f)
    )

    skipTypes.forEach((skip) => {
      if (typeof skip === 'string') {
        typesToIgnore.add(skip)
      } else if (skip instanceof RegExp) {
        typesToIgnoreRegex.push(skip)
      } else {
        throw new Error('Invalid type for options.skipTypes, expected string or RegExp')
      }
    })

    const typeSources = await Promise.all(
      options.modules.map(async (source) => {
        // Keeping all of this in here so if we don't have any sources
        // e.g. in the Playground, it doesn't break things.

        // Yeah, this doesn't exist in Node 6, but since this is a new
        // lib and Node 6 is close to EOL so if you really need it, open a PR :)
        const fs = require('fs') as typeof import('fs')
        const util = require('util') as typeof import('util')
        const readFile = util.promisify(fs.readFile)
        const { module: pathOrModule, glob = true, onlyTypes, alias, typeMatch } = source
        if (path.isAbsolute(pathOrModule) && path.extname(pathOrModule) !== '.ts') {
          return console.warn(
            `Nexus Schema Typegen: Expected module ${pathOrModule} to be an absolute path to a TypeScript module, skipping.`
          )
        }
        let resolvedPath: string
        let fileContents: string
        try {
          resolvedPath = require.resolve(pathOrModule, {
            paths: [process.cwd()],
          })
          if (path.extname(resolvedPath) !== '.ts') {
            resolvedPath = findTypingForFile(resolvedPath, pathOrModule)
          }
          fileContents = await readFile(resolvedPath, 'utf-8')
        } catch (e) {
          if (e instanceof Error && e.message.indexOf('Cannot find module') !== -1) {
            console.error(`GraphQL Nexus: Unable to find file or module ${pathOrModule}, skipping`)
          } else {
            console.error(e.message)
          }
          return null
        }

        const importPath = (
          path.isAbsolute(pathOrModule) ? relativePathTo(resolvedPath, outputPath) : pathOrModule
        ).replace(typeScriptFileExtension, '')

        if (allImportsMap[alias] && allImportsMap[alias] !== importPath) {
          return console.warn(
            `Nexus Schema Typegen: Cannot have multiple type sources ${importsMap[alias]} and ${pathOrModule} with the same alias ${alias}, skipping`
          )
        }
        allImportsMap[alias] = importPath

        if (forceImports.has(alias)) {
          importsMap[alias] = [importPath, glob]
          forceImports.delete(alias)
        }

        return {
          alias,
          glob,
          importPath,
          fileContents,
          onlyTypes,
          typeMatch: typeMatch || defaultTypeMatcher,
        }
      })
    )

    const builtinScalars = new Set(Object.keys(SCALAR_TYPES))

    Object.keys(typeMap).forEach((typeName) => {
      if (typeName.indexOf('__') === 0) {
        return
      }
      if (typesToIgnore.has(typeName)) {
        return
      }
      if (typesToIgnoreRegex.some((r) => r.test(typeName))) {
        return
      }
      if (sourceTypeMap[typeName]) {
        return
      }
      if (builtinScalars.has(typeName)) {
        return
      }

      const type = schema.getType(typeName)

      // For now we'll say that if it's output type it can be backed
      if (isOutputType(type)) {
        for (let i = 0; i < typeSources.length; i++) {
          const typeSource = typeSources[i]
          if (!typeSource) {
            continue
          }
          // If we've specified an array of "onlyTypes" to match ensure the
          // `typeName` falls within that list.
          if (typeSource.onlyTypes) {
            if (
              !typeSource.onlyTypes.some((t) => {
                return t instanceof RegExp ? t.test(typeName) : t === typeName
              })
            ) {
              continue
            }
          }
          const { fileContents, importPath, glob, alias, typeMatch } = typeSource
          const typeRegex = typeMatch(type, defaultTypeMatcher(type)[0])
          const matched = firstMatch(fileContents, Array.isArray(typeRegex) ? typeRegex : [typeRegex])
          if (matched) {
            if (debug) {
              log(`Matched type - ${typeName} in "${importPath}" - ${alias}.${matched[1]}`)
            }
            importsMap[alias] = [importPath, glob]
            sourceTypeMap[typeName] = `${alias}.${matched[1]}`
          } else {
            if (debug) {
              log(`No match for ${typeName} in "${importPath}" using ${typeRegex}`)
            }
          }
        }
      }
    })

    if (forceImports.size > 0) {
      console.error(`Missing required typegen import: ${Array.from(forceImports)}`)
    }

    const imports: string[] = []

    Object.keys(importsMap)
      .sort()
      .forEach((alias) => {
        const [importPath, glob] = importsMap[alias]
        const safeImportPath = importPath.replace(/\\+/g, '/')
        imports.push(`import type ${glob ? '* as ' : ''}${alias} from "${safeImportPath}"`)
      })

    const typegenInfo = {
      headers: headers || [TYPEGEN_HEADER],
      sourceTypeMap,
      imports,
      contextTypeImport: contextType,
      nexusSchemaImportId: getOwnPackage().name,
    }

    return typegenInfo
  }
}

function findTypingForFile(absolutePath: string, pathOrModule: string) {
  // First try to find the "d.ts" adjacent to the file
  try {
    const typeDefPath = absolutePath.replace(path.extname(absolutePath), '.d.ts')
    require.resolve(typeDefPath)
    return typeDefPath
  } catch (e) {
    console.error(e)
  }

  // TODO: need to figure out cases where it's a node module
  // and "typings" is set in the package.json

  throw new Error(`Unable to find typings associated with ${pathOrModule}, skipping`)
}

const firstMatch = (fileContents: string, typeRegex: RegExp[]): RegExpExecArray | null => {
  for (let i = 0; i < typeRegex.length; i++) {
    const regex = typeRegex[i]
    const match = regex.exec(fileContents)
    if (match) {
      return match
    }
  }
  return null
}

const defaultTypeMatcher = (type: GraphQLNamedType) => {
  return [new RegExp(`(?:interface|type|class|enum)\\s+(${type.name})\\W`, 'g')]
}
