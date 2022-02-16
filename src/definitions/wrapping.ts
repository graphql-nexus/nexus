import {
  GraphQLInputType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLType,
  isWrappingType,
  isListType,
  isNonNullType,
} from 'graphql'
import type { DynamicInputMethodDef, DynamicOutputMethodDef } from '../dynamicMethod'
import type { DynamicOutputPropertyDef } from '../dynamicProperty'
import type { NexusPlugin } from '../plugin'
import type { AllInputTypes, GetGen } from '../typegenTypeHelpers'
import { PrintedGenTyping, PrintedGenTypingImport, Unreachable } from '../utils'
import { NexusArgDef, arg } from './args'
import type { NexusEnumTypeDef } from './enumType'
import type { NexusExtendInputTypeDef } from './extendInputType'
import type { NexusExtendTypeDef } from './extendType'
import type { NexusInputObjectTypeDef } from './inputObjectType'
import type { NexusInterfaceTypeDef } from './interfaceType'
import { list, NexusListDef } from './list'
import { NexusNonNullDef, nonNull } from './nonNull'
import { NexusNullDef, nullable } from './nullable'
import type { NexusObjectTypeDef } from './objectType'
import type { NexusScalarTypeDef } from './scalarType'
import { isNexusMetaType, NexusMetaType, resolveNexusMetaType } from './nexusMeta'
import type { NexusUnionTypeDef } from './unionType'
import { NexusTypes, NexusWrappedSymbol } from './_types'

/** Input(named): Nexus only */
export type AllNexusNamedInputTypeDefs<T extends string = any> =
  | NexusInputObjectTypeDef<T>
  | NexusEnumTypeDef<T>
  | NexusScalarTypeDef<T>

/** Input(named): Nexus + GraphQLInput */
export type AllNamedInputTypeDefs<T extends string = any> =
  | AllNexusNamedInputTypeDefs<T>
  | Exclude<GraphQLInputType, GraphQLList<any> | GraphQLNonNull<any>>

/** Input(all): Nexus + GraphQL */
export type AllNexusInputTypeDefs<T extends string = any> =
  | AllNamedInputTypeDefs<T>
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>
  | GraphQLList<any>
  | GraphQLNonNull<any>

/** Output(named): Nexus only */
export type AllNexusNamedOutputTypeDefs =
  | NexusObjectTypeDef<any>
  | NexusInterfaceTypeDef<any>
  | NexusUnionTypeDef<any>
  | NexusEnumTypeDef<any>
  | NexusScalarTypeDef<any>

/** Output(all): Nexus only */
export type AllNexusOutputTypeDefs =
  | AllNexusNamedOutputTypeDefs
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>

/** Input + output(named): Nexus only */
export type AllNexusNamedTypeDefs = AllNexusNamedInputTypeDefs | AllNexusNamedOutputTypeDefs

/** Input + output(all): Nexus only */
export type AllNexusTypeDefs = AllNexusOutputTypeDefs | AllNexusInputTypeDefs

/** Input + output(all): Nexus only + Name */
export type AllNamedTypeDefs = AllNexusNamedTypeDefs | GraphQLNamedType

/** All inputs to list(...) */
export type NexusListableTypes =
  | GetGen<'allNamedTypes', string>
  | AllNamedTypeDefs
  | NexusArgDef<any>
  | NexusListDef<NexusListableTypes>
  | NexusNonNullDef<NexusNonNullableTypes>
  | NexusNullDef<NexusNullableTypes>
  | GraphQLType
  | NexusMetaType

/** All inputs to nonNull(...) */
export type NexusNonNullableTypes =
  | GetGen<'allNamedTypes', string>
  | AllNamedTypeDefs
  | NexusListDef<NexusListableTypes>
  | NexusArgDef<any>
  | NexusMetaType

/** All inputs to nullable(...) */
export type NexusNullableTypes =
  | GetGen<'allNamedTypes', string>
  | AllNamedTypeDefs
  | NexusListDef<NexusListableTypes>
  | NexusArgDef<any>
  | NexusMetaType

export type AllNexusNamedArgsDefs<T extends AllInputTypes = AllInputTypes> =
  | T
  | NexusArgDef<T>
  | AllNamedInputTypeDefs<T>
  | GraphQLInputType

export type AllNexusArgsDefs =
  | AllNexusNamedArgsDefs
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>
  | GraphQLInputType

const NamedTypeDefs = new Set([
  NexusTypes.Enum,
  NexusTypes.Object,
  NexusTypes.Scalar,
  NexusTypes.Union,
  NexusTypes.Interface,
  NexusTypes.InputObject,
])

export const isNexusTypeDef = (obj: any): obj is { [NexusWrappedSymbol]: NexusTypes } => {
  console.warn(`isNexusTypeDef is deprecated, use isNexusStruct`)
  return isNexusStruct(obj)
}

export function isNexusStruct(obj: any): obj is { [NexusWrappedSymbol]: NexusTypes } {
  return obj && Boolean(obj[NexusWrappedSymbol])
}
export function isNexusNamedTypeDef(obj: any): obj is AllNexusNamedTypeDefs {
  return isNexusStruct(obj) && NamedTypeDefs.has(obj[NexusWrappedSymbol]) && 'name' in obj
}
export function isNexusListTypeDef(obj: any): obj is NexusListDef<any> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.List
}

export function isNexusNonNullTypeDef(obj: any): obj is NexusNonNullDef<any> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.NonNull
}

export function isNexusNullTypeDef(obj: any): obj is NexusNullDef<any> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Null
}

export function isNexusWrappingType(
  obj: any
): obj is NexusListDef<any> | NexusNullDef<any> | NexusNonNullDef<any> {
  return isNexusListTypeDef(obj) || isNexusNullTypeDef(obj) || isNexusNonNullTypeDef(obj)
}

export function isNexusExtendInputTypeDef(obj: any): obj is NexusExtendInputTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.ExtendInputObject
}
export function isNexusExtendTypeDef(obj: any): obj is NexusExtendTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.ExtendObject
}

export function isNexusEnumTypeDef(obj: any): obj is NexusEnumTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Enum
}
export function isNexusInputObjectTypeDef(obj: any): obj is NexusInputObjectTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.InputObject
}
export function isNexusObjectTypeDef(obj: any): obj is NexusObjectTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Object
}
export function isNexusScalarTypeDef(obj: any): obj is NexusScalarTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Scalar
}
export function isNexusUnionTypeDef(obj: any): obj is NexusUnionTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Union
}
export function isNexusInterfaceTypeDef(obj: any): obj is NexusInterfaceTypeDef<string> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Interface
}
export function isNexusArgDef(obj: any): obj is NexusArgDef<AllInputTypes> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Arg
}

export function isNexusNamedOuputTypeDef(obj: any): obj is AllNexusNamedOutputTypeDefs {
  return isNexusNamedTypeDef(obj) && !isNexusInputObjectTypeDef(obj)
}
export function isNexusNamedInputTypeDef(obj: any): obj is AllNexusNamedInputTypeDefs {
  return isNexusNamedTypeDef(obj) && !isNexusObjectTypeDef(obj) && !isNexusInterfaceTypeDef(obj)
}

export function isNexusDynamicOutputProperty<T extends string>(obj: any): obj is DynamicOutputPropertyDef<T> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.DynamicOutputProperty
}
export function isNexusDynamicOutputMethod<T extends string>(obj: any): obj is DynamicOutputMethodDef<T> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.DynamicOutputMethod
}
export function isNexusDynamicInputMethod<T extends string>(obj: any): obj is DynamicInputMethodDef<T> {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.DynamicInput
}
export function isNexusPrintedGenTyping(obj: any): obj is PrintedGenTyping {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.PrintedGenTyping
}
export function isNexusPrintedGenTypingImport(obj: any): obj is PrintedGenTypingImport {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.PrintedGenTypingImport
}

export function isNexusPlugin(obj: any): obj is NexusPlugin {
  return isNexusStruct(obj) && obj[NexusWrappedSymbol] === NexusTypes.Plugin
}

export type NexusWrapKind = 'NonNull' | 'Null' | 'List'
export type NexusFinalWrapKind = 'NonNull' | 'List'

export function unwrapGraphQLDef(typeDef: GraphQLType): {
  namedType: GraphQLNamedType
  wrapping: NexusFinalWrapKind[]
} {
  const wrapping: NexusFinalWrapKind[] = []
  let namedType = typeDef
  while (isWrappingType(namedType)) {
    if (isListType(namedType)) {
      wrapping.unshift('List')
    } else if (isNonNullType(namedType)) {
      wrapping.unshift('NonNull')
    } else {
      throw new Unreachable(namedType)
    }
    namedType = namedType.ofType
  }
  return { namedType, wrapping }
}

/** Unwraps any wrapped Nexus or GraphQL types, turning into a list of wrapping */
export function unwrapNexusDef(
  typeDef: AllNexusTypeDefs | AllNexusArgsDefs | GraphQLType | NexusMetaType | string
): {
  namedType: AllNexusNamedTypeDefs | AllNexusArgsDefs | GraphQLNamedType | string
  wrapping: NexusWrapKind[]
} {
  const wrapping: NexusWrapKind[] = []
  let namedType = typeDef
  while (isNexusWrappingType(namedType) || isWrappingType(namedType) || isNexusMetaType(namedType)) {
    if (isNexusMetaType(namedType)) {
      namedType = resolveNexusMetaType(namedType)
    } else if (isWrappingType(namedType)) {
      if (isListType(namedType)) {
        wrapping.unshift('List')
      } else if (isNonNullType(namedType)) {
        wrapping.unshift('NonNull')
      } else {
        throw new Unreachable(namedType)
      }
      namedType = namedType.ofType
    } else {
      if (isNexusNonNullTypeDef(namedType)) {
        wrapping.unshift('NonNull')
      }
      if (isNexusNullTypeDef(namedType)) {
        wrapping.unshift('Null')
      }
      if (isNexusListTypeDef(namedType)) {
        wrapping.unshift('List')
      }
      namedType = namedType.ofNexusType
    }
  }
  return { namedType, wrapping }
}

/** Takes the named type, and applies any of the NexusFinalWrapKind to create a properly wrapped GraphQL type. */
export function rewrapAsGraphQLType(baseType: GraphQLNamedType, wrapping: NexusFinalWrapKind[]): GraphQLType {
  let finalType: GraphQLType = baseType
  wrapping.forEach((wrap) => {
    if (wrap === 'List') {
      finalType = new GraphQLList(finalType)
    } else if (wrap === 'NonNull') {
      if (!isNonNullType(finalType)) {
        finalType = new GraphQLNonNull(finalType)
      }
    } else {
      throw new Unreachable(wrap)
    }
  })
  return finalType
}

/**
 * Apply the wrapping consistently to the arg `type`
 *
 * NonNull(list(stringArg())) -> arg({ type: nonNull(list('String')) })
 */
export function normalizeArgWrapping(argVal: AllNexusArgsDefs): NexusArgDef<AllInputTypes> {
  if (isNexusArgDef(argVal)) {
    return argVal
  }
  if (isNexusWrappingType(argVal)) {
    let { namedType, wrapping } = unwrapNexusDef(argVal)
    if (isNexusArgDef(namedType)) {
      const config = namedType.value
      return arg({ ...config, type: applyNexusWrapping(config.type, wrapping) })
    }
    return arg({ type: applyNexusWrapping(namedType, wrapping) })
  }
  return arg({ type: argVal })
}

/**
 * Applies the ['List', 'NonNull', 'Nullable']
 *
 * @param toWrap
 * @param wrapping
 */
export function applyNexusWrapping(toWrap: any, wrapping: NexusWrapKind[]) {
  let finalType = toWrap
  wrapping.forEach((wrap) => {
    if (wrap === 'List') {
      finalType = list(finalType)
    } else if (wrap === 'NonNull') {
      finalType = nonNull(finalType)
    } else if (wrap === 'Null') {
      finalType = nullable(finalType)
    } else {
      throw new Unreachable(wrap)
    }
  })
  return finalType
}

/**
 * Takes the "nonNullDefault" value, the chained wrapping, and the field wrapping, to determine the proper
 * list of wrapping to apply to the field
 */
export function finalizeWrapping(
  nonNullDefault: boolean,
  typeWrapping: NexusWrapKind[] | ReadonlyArray<NexusWrapKind>,
  chainWrapping?: NexusWrapKind[]
): NexusFinalWrapKind[] {
  let finalChain: NexusFinalWrapKind[] = []
  const allWrapping = typeWrapping.concat(chainWrapping ?? [])
  // Ensure the first item is wrapped, if we're not guarding
  if (nonNullDefault && (!allWrapping[0] || allWrapping[0] === 'List')) {
    allWrapping.unshift('NonNull')
  }
  for (let i = 0; i < allWrapping.length; i++) {
    const current = allWrapping[i]
    const next = allWrapping[i + 1]
    if (current === 'Null') {
      continue
    } else if (current === 'NonNull') {
      finalChain.push('NonNull')
    } else if (current === 'List') {
      finalChain.push('List')
      if (nonNullDefault && (next === 'List' || !next)) {
        finalChain.push('NonNull')
      }
    }
  }
  return finalChain
}
