import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLType,
  GraphQLUnionType,
  isAbstractType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isSpecifiedScalarType,
  isUnionType,
  isWrappingType,
  specifiedScalarTypes,
} from 'graphql'
import * as path from 'path'
import { decorateType } from './definitions/decorateType'
import { list } from './definitions/list'
import { nonNull } from './definitions/nonNull'
import { nullable } from './definitions/nullable'
import {
  AllNexusArgsDefs,
  AllNexusInputTypeDefs,
  AllNexusNamedArgsDefs,
  AllNexusNamedInputTypeDefs,
  AllNexusNamedOutputTypeDefs,
  AllNexusNamedTypeDefs,
  AllNexusOutputTypeDefs,
  AllNexusTypeDefs,
  isNexusListTypeDef,
  isNexusNonNullTypeDef,
  isNexusNullTypeDef,
  isNexusWrappingType,
} from './definitions/wrapping'
import {
  MissingType,
  NexusFeatures,
  NexusGraphQLSchema,
  NexusTypes,
  withNexusSymbol,
} from './definitions/_types'

export const isInterfaceField = (type: GraphQLObjectType, fieldName: string) => {
  return type.getInterfaces().some((i) => Boolean(i.getFields()[fieldName]))
}

// ----------------------------

/**
 *
 * Copied from graphql-js:
 *
 */

/**
 * Given an invalid input string and a list of valid options, returns a filtered
 * list of valid options sorted based on their similarity with the input.
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
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * Includes a custom alteration from Damerau-Levenshtein to treat case changes
 * as a single edit which helps identify mis-cased values with an edit distance
 * of 1.
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
  if (!path.isAbsolute(pathName)) {
    throw new Error(`Expected path for ${property} to be an absolute path, saw ${pathName}`)
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
      if (typeName.indexOf('__') === 0) {
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

export function relativePathTo(absolutePath: string, outputPath: string): string {
  const filename = path.basename(absolutePath).replace(/(\.d)?\.ts/, '')
  const relative = path.relative(path.dirname(outputPath), path.dirname(absolutePath))
  if (relative.indexOf('.') !== 0) {
    return `./${path.join(relative, filename)}`
  }
  return path.join(relative, filename)
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
  description?: string
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

export function unwrapType(
  type: GraphQLType
): { type: GraphQLNamedType; isNonNull: boolean; list: boolean[] } {
  let finalType = type
  let isNonNull = false
  const list = []
  while (isWrappingType(finalType)) {
    while (isListType(finalType)) {
      finalType = finalType.ofType
      if (isNonNullType(finalType)) {
        finalType = finalType.ofType
        list.unshift(true)
      } else {
        list.unshift(false)
      }
    }
    if (isNonNullType(finalType)) {
      isNonNull = true
      finalType = finalType.ofType
    }
  }
  return { type: finalType, isNonNull, list }
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
 * Calculate the venn diagram between two iterables based on reference equality
 * checks. The returned tripple contains items thusly:
 *
 *    * items only in arg 1 --> first tripple slot
 *    * items in args 1 & 2 --> second tripple slot
 *    * items only in arg 2 --> third tripple slot
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
    rootTyping: 'never',
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

/**
 * Use this to make assertion at end of if-else chain that all members of a
 * union have been accounted for.
 */
export function casesHandled(x: never): never {
  throw new Error(`A case was not handled for value: ${x}`)
}

/**
 * Quickly log objects
 */
export function dump(x: any) {
  console.log(require('util').inspect(x, { depth: null }))
}

export function isNodeModule(path: string) {
  return /^([A-z0-9@])/.test(path)
}

export type NexusWrapKind = 'NonNull' | 'Null' | 'List' | 'WrappedType'

export function unwrapNexusDef(
  typeDef: AllNexusTypeDefs | AllNexusArgsDefs | string
): { namedType: AllNexusNamedTypeDefs | AllNexusArgsDefs | string; wrapping: NexusWrapKind[] } {
  const wrapping: NexusWrapKind[] = []
  let namedType = typeDef

  while (isNexusWrappingType(namedType)) {
    if (isNexusNonNullTypeDef(namedType)) {
      wrapping.unshift('NonNull')
    }

    if (isNexusNullTypeDef(namedType)) {
      wrapping.unshift('Null')
    }

    if (isNexusListTypeDef(namedType)) {
      wrapping.unshift('List')
    }

    namedType = namedType.ofType
  }

  wrapping.unshift('WrappedType')

  return { namedType, wrapping }
}

/**
 * Take a Nexus Wrapped Def, unwraps it, and rewraps it as a GraphQL wrapped type
 * The outputted GraphQL type also reflects the nullability defaults
 */
export function rewrapAsGraphQLType(
  nexusDef: AllNexusOutputTypeDefs | string,
  baseType: GraphQLNamedType,
  nonNullDefault: boolean
): GraphQLOutputType
export function rewrapAsGraphQLType(
  nexusDef: AllNexusInputTypeDefs | string,
  baseType: GraphQLNamedType,
  nonNullDefault: boolean
): GraphQLInputType
export function rewrapAsGraphQLType(
  nexusDef: AllNexusTypeDefs | string,
  namedType: GraphQLNamedType,
  nonNullDefault: boolean
): GraphQLOutputType | GraphQLInputType {
  const { wrapping } = unwrapNexusDef(nexusDef)
  let finalType: GraphQLType = namedType

  if (wrapping[0] !== 'WrappedType') {
    throw new Error('Missing leading WrappedType. This should never happen, please create an issue.')
  }

  for (let i = 0; i < wrapping.length; i++) {
    if (wrapping[i] === 'List' && wrapping[i + 1] === 'NonNull') {
      finalType = GraphQLNonNull(GraphQLList(finalType))
      i += 1
      continue
    }

    if (wrapping[i] === 'List' && wrapping[i + 1] === 'Null') {
      finalType = GraphQLList(finalType)
      i += 1
      continue
    }

    if (wrapping[i] === 'WrappedType' && wrapping[i + 1] === 'Null') {
      i += 1
      continue
    }

    if (wrapping[i] === 'WrappedType' && wrapping[i + 1] === 'NonNull') {
      finalType = GraphQLNonNull(finalType)
      i += 1
      continue
    }

    if (wrapping[i] === 'List') {
      finalType = nonNullDefault ? GraphQLNonNull(GraphQLList(finalType)) : GraphQLList(finalType)
    }

    if (wrapping[i] === 'WrappedType' && nonNullDefault) {
      finalType = GraphQLNonNull(finalType)
    }
  }

  return finalType
}

export function wrapAsNexusType(
  baseType: AllNexusNamedOutputTypeDefs | string,
  wrapping: NexusWrapKind[],
  nonNullDefault: boolean
): AllNexusOutputTypeDefs
export function wrapAsNexusType(
  baseType: AllNexusNamedInputTypeDefs | string,
  wrapping: NexusWrapKind[],
  nonNullDefault: boolean
): AllNexusInputTypeDefs
export function wrapAsNexusType(
  baseType: AllNexusNamedTypeDefs | string,
  wrapping: NexusWrapKind[],
  nonNullDefault: boolean
): AllNexusTypeDefs {
  let finalType: any = baseType

  if (wrapping[0] !== 'WrappedType') {
    throw new Error('Missing leading WrappedType. This should never happen, please create an issue.')
  }

  for (let i = 0; i < wrapping.length; i++) {
    if (wrapping[i] === 'List' && wrapping[i + 1] === 'NonNull') {
      finalType = nonNull(list(finalType))
      i += 1
      continue
    }

    if (wrapping[i] === 'List' && wrapping[i + 1] === 'Null') {
      finalType = nullable(list(finalType))
      i += 1
      continue
    }

    if (wrapping[i] === 'WrappedType' && wrapping[i + 1] === 'NonNull') {
      finalType = nonNull(finalType)
      i += 1
      continue
    }
    if (wrapping[i] === 'WrappedType' && wrapping[i + 1] === 'Null') {
      finalType = nullable(finalType)
      i += 1
      continue
    }

    if (wrapping[i] === 'List') {
      finalType = nonNullDefault ? nonNull(list(finalType)) : list(finalType)
    }

    if (wrapping[i] === 'NonNull') {
      finalType = nonNull(finalType)
    }

    if (wrapping[i] === 'Null') {
      finalType = nullable(finalType)
    }

    if (wrapping[i] === 'WrappedType' && nonNullDefault) {
      finalType = nonNull(finalType)
    }
  }

  return finalType
}

export function getNexusNamedArgDef(argDef: AllNexusArgsDefs | string): AllNexusNamedArgsDefs | string {
  if (typeof argDef === 'string') {
    return argDef
  }

  let namedType = argDef

  while (isNexusWrappingType(namedType)) {
    namedType = namedType.ofType
  }

  return namedType
}

export function getNexusNamedType(type: AllNexusTypeDefs | string): AllNexusNamedTypeDefs | string {
  if (typeof type === 'string') {
    return type
  }

  let namedType = type

  while (isNexusWrappingType(namedType)) {
    namedType = namedType.ofType
  }

  return namedType
}

/**
 * Assertion utility with nexus-aware feedback for users.
 */
export function invariantGuard(val: any) {
  /* istanbul ignore next */
  if (Boolean(val) === false) {
    throw new Error(
      'Nexus Error: This should never happen, ' +
        'please check your code or if you think this is a bug open a GitHub issue https://github.com/graphql-nexus/schema/issues/new.'
    )
  }
}

/**
 * Is the current stage production? If NODE_ENV envar is set to "production" or "prod" then yes it is.
 */
export function isProductionStage() {
  return process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'prod'
}

/**
 * Throw a programmer error in production but only log it in development.
 */
export function raiseProgrammerError(error: Error) {
  if (isProductionStage()) {
    throw error
  } else {
    console.error(error)
  }
}
