import * as fs from 'fs'
import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLInterfaceTypeConfig,
  GraphQLNamedType,
  GraphQLObjectType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLType,
  GraphQLUnionType,
  isAbstractType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isObjectType,
  isScalarType,
  isSpecifiedScalarType,
  isUnionType,
  isWrappingType,
  specifiedScalarTypes,
} from 'graphql'
import * as Path from 'path'
import { decorateType } from './definitions/decorateType'
import { isNexusMetaType, NexusMetaType, resolveNexusMetaType } from './definitions/nexusMeta'
import {
  AllNexusArgsDefs,
  AllNexusNamedTypeDefs,
  AllNexusTypeDefs,
  isNexusWrappingType,
  isNexusArgDef,
  AllNamedInputTypeDefs,
} from './definitions/wrapping'
import {
  Maybe,
  MissingType,
  NexusFeatures,
  NexusGraphQLSchema,
  NexusTypes,
  TypingImport,
  withNexusSymbol,
} from './definitions/_types'

export const isInterfaceField = (type: GraphQLObjectType, fieldName: string) => {
  return type.getInterfaces().some((i) => Boolean(i.getFields()[fieldName]))
}

// ----------------------------

/** Copied from graphql-js: */

/**
 * Given an invalid input string and a list of valid options, returns a filtered list of valid options sorted
 * based on their similarity with the input.
 */
export function suggestionList(input: string = '', options: string[] = []): string[] {
  var optionsByDistance = Object.create(null)
  var oLength = options.length
  var inputThreshold = input.length / 2

  for (var i = 0; i < oLength; i++) {
    var distance = lexicalDistance(input, options[i])
    var threshold = Math.max(inputThreshold, options[i].length / 2, 1)

    if (distance <= threshold) {
      optionsByDistance[options[i]] = distance
    }
  }

  return Object.keys(optionsByDistance).sort(function (a, b) {
    return optionsByDistance[a] - optionsByDistance[b]
  })
}
/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number of edits needed to transform
 * string A into string B. An edit can be an insertion, deletion, or substitution of a single character, or a
 * swap of two adjacent characters.
 *
 * Includes a custom alteration from Damerau-Levenshtein to treat case changes as a single edit which helps
 * identify mis-cased values with an edit distance of 1.
 *
 * This distance can be useful for detecting typos in input or sorting
 */
function lexicalDistance(aStr: string, bStr: string): number {
  if (aStr === bStr) {
    return 0
  }

  let i: number
  let j: number
  const d: number[][] = []
  const a = aStr.toLowerCase()
  const b = bStr.toLowerCase()
  const aLength = a.length
  const bLength = b.length // Any case change counts as a single edit

  if (a === b) {
    return 1
  }

  for (i = 0; i <= aLength; i++) {
    d[i] = [i]
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost)
      }
    }
  }

  return d[aLength][bLength]
}

// ----------------------------

export function objValues<T>(obj: Record<string, T>): T[] {
  return Object.keys(obj).reduce((result: T[], key) => {
    result.push(obj[key])
    return result
  }, [])
}

export function mapObj<T, R>(obj: Record<string, T>, mapper: (val: T, key: string, index: number) => R) {
  return Object.keys(obj).map((key, index) => mapper(obj[key], key, index))
}

export function mapValues<T, R>(obj: Record<string, T>, mapper: (val: T, key: string, index: number) => R) {
  const result: Record<string, any> = {}
  Object.keys(obj).forEach((key, index) => (result[key] = mapper(obj[key], key, index)))
  return result
}

export function eachObj<T>(obj: Record<string, T>, iter: (val: T, key: string, index: number) => void) {
  Object.keys(obj).forEach((name, i) => iter(obj[name], name, i))
}

export const isObject = (obj: any): boolean => obj !== null && typeof obj === 'object'

export const assertAbsolutePath = (pathName: string, property: string) => {
  if (!Path.isAbsolute(pathName)) {
    throw new Error(`Expected path for "${property}" to be an absolute path, saw "${pathName}"`)
  }
  return pathName
}

export interface GroupedTypes {
  input: GraphQLInputObjectType[]
  interface: GraphQLInterfaceType[]
  object: GraphQLObjectType[]
  union: GraphQLUnionType[]
  enum: GraphQLEnumType[]
  scalar: Array<GraphQLScalarType & { asNexusMethod?: string }>
}

export function groupTypes(schema: GraphQLSchema) {
  const groupedTypes: GroupedTypes = {
    input: [],
    interface: [],
    object: [],
    union: [],
    enum: [],
    scalar: Array.from(specifiedScalarTypes),
  }
  const schemaTypeMap = schema.getTypeMap()
  Object.keys(schemaTypeMap)
    .sort()
    .forEach((typeName) => {
      if (typeName.startsWith('__')) {
        return
      }
      const type = schema.getType(typeName)
      if (isObjectType(type)) {
        groupedTypes.object.push(type)
      } else if (isInputObjectType(type)) {
        groupedTypes.input.push(type)
      } else if (isScalarType(type) && !isSpecifiedScalarType(type) && !isUnknownType(type)) {
        groupedTypes.scalar.push(type)
      } else if (isUnionType(type)) {
        groupedTypes.union.push(type)
      } else if (isInterfaceType(type)) {
        groupedTypes.interface.push(type)
      } else if (isEnumType(type)) {
        groupedTypes.enum.push(type)
      }
    })
  return groupedTypes
}

export function isUnknownType(type: GraphQLNamedType) {
  return type.name === UNKNOWN_TYPE_SCALAR.name
}

export function firstDefined<T>(...args: Array<T | undefined>): T {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (typeof arg !== 'undefined') {
      return arg
    }
  }
  /* istanbul ignore next */
  throw new Error('At least one of the values should be defined')
}

export function isPromiseLike(value: any): value is PromiseLike<any> {
  return Boolean(value && typeof value.then === 'function')
}

export const typeScriptFileExtension = /(\.d)?\.ts$/

function makeRelativePathExplicitlyRelative(path: string) {
  if (Path.isAbsolute(path)) return path
  if (path.startsWith('./')) return path
  return `./${path}`
}

function nixifyPathSlashes(path: string): string {
  return path.replace(/\\+/g, '/')
}

/**
 * Format a path so it is suitable to be used as a module import.
 *
 * - Implicitly relative is made explicitly relative - TypeScript file extension is stripped - Windows slashes
 * converted into *nix slashes
 *
 * Do not pass Node module IDs here as they will be treated as relative paths e.g. "react" "@types/react" etc.
 */
export function formatPathForModuleImport(path: string) {
  return nixifyPathSlashes(makeRelativePathExplicitlyRelative(path).replace(typeScriptFileExtension, ''))
}

export function relativePathTo(absolutePath: string, fromPath: string): string {
  const filename = Path.basename(absolutePath)
  const relative = Path.relative(Path.dirname(fromPath), Path.dirname(absolutePath))
  return formatPathForModuleImport(Path.join(relative, filename))
}

export interface PrintedGenTypingImportConfig {
  module: string
  default?: string
  bindings?: Array<string | [string, string]> // import { X } or import { X as Y }
}

export class PrintedGenTypingImport {
  constructor(readonly config: PrintedGenTypingImportConfig) {}
}
withNexusSymbol(PrintedGenTypingImport, NexusTypes.PrintedGenTypingImport)

export function printedGenTypingImport(config: PrintedGenTypingImportConfig) {
  return new PrintedGenTypingImport(config)
}

export interface PrintedGenTypingConfig {
  name: string
  optional: boolean
  type: string
  description?: Maybe<string>
  imports?: PrintedGenTypingImport[]
}

export class PrintedGenTyping {
  constructor(protected config: PrintedGenTypingConfig) {}

  get imports() {
    return this.config.imports || []
  }

  toString() {
    let str = ``
    if (this.config.description) {
      const descriptionLines = this.config.description
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s)
        .map((s) => ` * ${s}`)
        .join('\n')
      str = `/**\n${descriptionLines}\n */\n`
    }
    const field = `${this.config.name}${this.config.optional ? '?' : ''}`
    str += `${field}: ${this.config.type}`
    return str
  }
}
withNexusSymbol(PrintedGenTyping, NexusTypes.PrintedGenTyping)

export function printedGenTyping(config: PrintedGenTypingConfig) {
  return new PrintedGenTyping(config)
}

export function assertNoMissingTypes(schema: GraphQLSchema, missingTypes: Record<string, MissingType>) {
  const missingTypesNames = Object.keys(missingTypes)
  const schemaTypeMap = schema.getTypeMap()
  const schemaTypeNames = Object.keys(schemaTypeMap).filter(
    (typeName) => !isUnknownType(schemaTypeMap[typeName])
  )

  if (missingTypesNames.length > 0) {
    const errors = missingTypesNames
      .map((typeName) => {
        const { fromObject } = missingTypes[typeName]

        if (fromObject) {
          return `- Looks like you forgot to import ${typeName} in the root "types" passed to Nexus makeSchema`
        }

        const suggestions = suggestionList(typeName, schemaTypeNames)

        let suggestionsString = ''

        if (suggestions.length > 0) {
          suggestionsString = ` or mean ${suggestions.join(', ')}`
        }

        return `- Missing type ${typeName}, did you forget to import a type to the root query${suggestionsString}?`
      })
      .join('\n')

    throw new Error('\n' + errors)
  }
}

export function runAbstractTypeRuntimeChecks(schema: NexusGraphQLSchema, features: NexusFeatures) {
  if (features.abstractTypeRuntimeChecks === false) {
    return
  }

  const abstractTypes = Object.values(schema.getTypeMap()).filter(isAbstractType)

  abstractTypes.forEach((type) => {
    const kind = isInterfaceType(type) ? 'Interface' : 'Union'
    const resolveTypeImplemented = type.resolveType !== undefined
    const typesWithoutIsTypeOf = schema.getPossibleTypes(type).filter((type) => type.isTypeOf === undefined)

    // if no resolveType implemented but resolveType strategy enabled and isTypeOf strategy disabled
    if (
      resolveTypeImplemented === false &&
      features.abstractTypeStrategies.resolveType === true &&
      features.abstractTypeStrategies.isTypeOf === false
    ) {
      const messagePrefix = `You have a faulty implementation for your ${kind.toLowerCase()} type "${
        type.name
      }".`
      const message = `${messagePrefix} It is missing a \`resolveType\` implementation.`
      raiseProgrammerError(new Error(message))
    }

    // if some isTypeOf implementations are missing but isTypeOf strategy enabled
    if (
      typesWithoutIsTypeOf.length > 0 &&
      features.abstractTypeStrategies.isTypeOf === true &&
      features.abstractTypeStrategies.resolveType === false
    ) {
      const messageBadTypes = typesWithoutIsTypeOf.map((t) => `"${t.name}"`).join(', ')
      const messagePrefix = `You have a faulty implementation for your ${kind.toLowerCase()} type "${
        type.name
      }".`
      const messageSuffix = `are missing an \`isTypeOf\` implementation: ${messageBadTypes}`
      let message
      if (kind === 'Union') {
        message = `${messagePrefix} Some members of union type "${type.name}" ${messageSuffix}`
      } else if (kind === 'Interface') {
        message = `${messagePrefix} Some objects implementing the interface type "${type.name}" ${messageSuffix}`
      } else {
        casesHandled(kind)
      }
      raiseProgrammerError(new Error(message))
    }

    // if some isTypeOf or resolveType implementations are missing but isTypeOf and resolveType strategy enabled
    if (
      (resolveTypeImplemented === false || typesWithoutIsTypeOf.length > 0) &&
      features.abstractTypeStrategies.isTypeOf === true &&
      features.abstractTypeStrategies.resolveType === true
    ) {
      const messageBadTypes = typesWithoutIsTypeOf.map((t) => `"${t.name}"`).join(', ')
      const messagePrefix = `You have a faulty implementation for your ${kind.toLowerCase()} type "${
        type.name
      }". Either implement its \`resolveType\` or implement \`isTypeOf\` on each object`
      const messageSuffix = `These objects are missing an \`isTypeOf\` implementation: ${messageBadTypes}`
      let message
      if (kind === 'Union') {
        message = `${messagePrefix} in the union. ${messageSuffix}`
      } else if (kind === 'Interface') {
        message = `${messagePrefix} that implements this interface. ${messageSuffix}`
      } else {
        casesHandled(kind)
      }
      raiseProgrammerError(new Error(message))
    }
  })
}

export function consoleWarn(msg: string) {
  console.warn(msg)
}

export function log(msg: string) {
  console.log(`Nexus Schema: ${msg}`)
}

/**
 * Calculate the venn diagram between two iterables based on reference equality checks. The returned tripple
 * contains items thusly:
 *
 *     * items only in arg 1 --> first tripple slot
 *     * items in args 1 & 2 --> second tripple slot
 *     * items only in arg 2 --> third tripple slot
 */
export function venn<T>(xs: Iterable<T>, ys: Iterable<T>): [Set<T>, Set<T>, Set<T>] {
  const lefts: Set<T> = new Set(xs)
  const boths: Set<T> = new Set()
  const rights: Set<T> = new Set(ys)

  lefts.forEach((l) => {
    if (rights.has(l)) {
      boths.add(l)
      lefts.delete(l)
      rights.delete(l)
    }
  })

  return [lefts, boths, rights]
}

export const UNKNOWN_TYPE_SCALAR = decorateType(
  new GraphQLScalarType({
    name: 'NEXUS__UNKNOWN__TYPE',
    description: `
    This scalar should never make it into production. It is used as a placeholder for situations
    where GraphQL Nexus encounters a missing type. We don't want to error immediately, otherwise
    the TypeScript definitions will not be updated.
  `,
    parseValue(value) {
      throw new Error('Error: NEXUS__UNKNOWN__TYPE is not a valid scalar.')
    },
    parseLiteral(value) {
      throw new Error('Error: NEXUS__UNKNOWN__TYPE is not a valid scalar.')
    },
    serialize(value) {
      throw new Error('Error: NEXUS__UNKNOWN__TYPE is not a valid scalar.')
    },
  }),
  {
    sourceType: 'never',
  }
)

export function pathToArray(infoPath: GraphQLResolveInfo['path']): Array<string | number> {
  const flattened = []
  let curr: GraphQLResolveInfo['path'] | undefined = infoPath
  while (curr) {
    flattened.push(curr.key)
    curr = curr.prev
  }
  return flattened.reverse()
}

export function getOwnPackage(): { name: string } {
  return require('../package.json')
}

/** Use this to make assertion at end of if-else chain that all members of a union have been accounted for. */
export function casesHandled(x: never): never {
  throw new Error(`A case was not handled for value: "${x}"`)
}

/** Quickly log objects */
export function dump(x: any) {
  console.log(require('util').inspect(x, { depth: null }))
}

function isNodeModule(path: string) {
  // Avoid treating absolute windows paths as Node packages e.g. D:/a/b/c
  return !Path.isAbsolute(path) && /^([A-z0-9@])/.test(path)
}

export function resolveImportPath(rootType: TypingImport, typeName: string, outputPath: string) {
  const rootTypePath = rootType.module

  if (typeof rootTypePath !== 'string' || (!Path.isAbsolute(rootTypePath) && !isNodeModule(rootTypePath))) {
    throw new Error(
      `Expected an absolute path or Node package for the root typing path of the type "${typeName}", saw "${rootTypePath}"`
    )
  }

  if (isNodeModule(rootTypePath)) {
    try {
      require.resolve(rootTypePath)
    } catch (e) {
      throw new Error(`Module "${rootTypePath}" for the type "${typeName}" does not exist`)
    }
  } else if (!fs.existsSync(rootTypePath)) {
    throw new Error(`Root typing path "${rootTypePath}" for the type "${typeName}" does not exist`)
  }

  if (isNodeModule(rootTypePath)) {
    return rootTypePath
  }

  if (Path.isAbsolute(rootTypePath)) {
    return relativePathTo(rootTypePath, outputPath)
  }

  return rootTypePath
}

/** Given the right hand side of an arg definition, returns the underlying "named type" for us to add to the builder */
export function getArgNamedType(argDef: AllNexusArgsDefs | string): AllNamedInputTypeDefs | string {
  let finalValue = argDef
  if (typeof finalValue === 'string') {
    return finalValue
  }
  while (isNexusWrappingType(finalValue) || isWrappingType(finalValue) || isNexusArgDef(finalValue)) {
    if (isNexusArgDef(finalValue)) {
      finalValue = finalValue.value.type
    } else if (isNexusWrappingType(finalValue)) {
      finalValue = finalValue.ofNexusType
    } else if (isWrappingType(finalValue)) {
      finalValue = finalValue.ofType
    }
  }
  return finalValue
}

export function getNexusNamedType(
  type: AllNexusTypeDefs | NexusMetaType | GraphQLType | string
): AllNexusNamedTypeDefs | GraphQLNamedType | string {
  if (typeof type === 'string') {
    return type
  }
  let namedType = type
  while (isNexusWrappingType(namedType) || isWrappingType(namedType) || isNexusMetaType(namedType)) {
    if (isNexusWrappingType(namedType)) {
      namedType = namedType.ofNexusType
    }
    if (isWrappingType(namedType)) {
      namedType = namedType.ofType
    }
    if (isNexusMetaType(namedType)) {
      namedType = resolveNexusMetaType(namedType)
    }
  }
  return namedType as AllNexusNamedTypeDefs | GraphQLNamedType | string
}

/** Assertion utility with nexus-aware feedback for users. */
export function invariantGuard(val: any) {
  /* istanbul ignore next */
  if (Boolean(val) === false) {
    throw new Error(
      'Nexus Error: This should never happen, ' +
        'please check your code or if you think this is a bug open a GitHub issue https://github.com/graphql-nexus/schema/issues/new.'
    )
  }
}

/** Is the current stage production? If NODE_ENV envar is set to "production" or "prod" then yes it is. */
export function isProductionStage() {
  return process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod'
}

/** Throw a programmer error in production but only log it in development. */
export function raiseProgrammerError(error: Error) {
  if (isProductionStage()) {
    throw error
  } else {
    console.error(error)
  }
}

export class Unreachable extends Error {
  /* istanbul ignore next */
  constructor(val: never) {
    super(`Unreachable case or branch, unexpected ${val}`)
  }
}

export function graphql15InterfaceConfig<T extends GraphQLInterfaceTypeConfig<any, any>>(
  config: T
): T & { interfaces: GraphQLInterfaceType[] } {
  return {
    ...config,
    interfaces: [],
  }
}

export function graphql15InterfaceType<T extends GraphQLInterfaceType>(
  type: T & { getInterfaces?: () => ReadonlyArray<GraphQLInterfaceType> }
): T & { getInterfaces(): ReadonlyArray<GraphQLInterfaceType> } {
  if (typeof type.getInterfaces !== 'function') {
    type.getInterfaces = () => []
  }
  return type as T & { getInterfaces(): ReadonlyArray<GraphQLInterfaceType> }
}

/** @internal */
export function unpack<T extends object>(val: T | (() => T)): T {
  if (val instanceof Function) {
    return val()
  }
  return val
}

/**
 * A specially typed version of `Array.isArray` to work around [this
 * issue](https://github.com/microsoft/TypeScript/issues/17002).
 */
export function isArray<T>(
  arg: T | {}
): arg is T extends readonly any[] ? (unknown extends T ? never : readonly any[]) : any[] {
  return Array.isArray(arg)
}

export const ownProp = {
  has<O extends object, K extends keyof O>(obj: O, key: K): boolean {
    return Boolean(Object.getOwnPropertyDescriptor(obj, key))
  },
  set<O extends object, K extends keyof O>(obj: O, key: K, value: O[K]): O[K] {
    Object.defineProperty(obj, key, { value })
    return value
  },
  get<O extends object, K extends keyof O>(obj: O, key: K): O[K] | undefined {
    return Object.getOwnPropertyDescriptor(obj, key)?.value
  },
}

export function result<T>(val: T | (() => T)): T {
  if (val instanceof Function) {
    return val()
  }
  return val as T
}
