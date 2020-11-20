import { DynamicInputMethodDef, DynamicOutputMethodDef } from '../dynamicMethod'
import { DynamicOutputPropertyDef } from '../dynamicProperty'
import { NexusPlugin } from '../plugin'
import { AllInputTypes, GetGen } from '../typegenTypeHelpers'
import { PrintedGenTyping, PrintedGenTypingImport } from '../utils'
import { NexusArgDef } from './args'
import { NexusEnumTypeDef } from './enumType'
import { NexusExtendInputTypeDef } from './extendInputType'
import { NexusExtendTypeDef } from './extendType'
import { NexusInputObjectTypeDef } from './inputObjectType'
import { NexusInterfaceTypeDef } from './interfaceType'
import { NexusListDef, list } from './list'
import { NexusNonNullDef, nonNull } from './nonNull'
import { NexusNullDef } from './nullable'
import { NexusObjectTypeDef } from './objectType'
import { NexusScalarTypeDef } from './scalarType'
import { NexusUnionTypeDef } from './unionType'
import { NexusTypes, NexusWrappedSymbol } from './_types'
import {
  GraphQLNamedType,
  GraphQLOutputType,
  GraphQLInputType,
  GraphQLType,
  GraphQLNonNull,
  GraphQLList,
} from 'graphql'

export type AllNexusNamedInputTypeDefs<T extends string = any> =
  | NexusInputObjectTypeDef<T>
  | NexusEnumTypeDef<T>
  | NexusScalarTypeDef<T>

export type AllNexusInputTypeDefs<T extends string = any> =
  | AllNexusNamedInputTypeDefs<T>
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>

export type AllNexusNamedOutputTypeDefs =
  | NexusObjectTypeDef<any>
  | NexusInterfaceTypeDef<any>
  | NexusUnionTypeDef<any>
  | NexusEnumTypeDef<any>
  | NexusScalarTypeDef<any>

export type AllNexusOutputTypeDefs =
  | AllNexusNamedOutputTypeDefs
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>

export type AllNexusNamedTypeDefs = AllNexusNamedInputTypeDefs | AllNexusNamedOutputTypeDefs

export type AllNexusTypeDefs = AllNexusOutputTypeDefs | AllNexusInputTypeDefs

export type NexusListableTypes =
  | AllNamedTypeDefs
  | NexusArgDef<any>
  | NexusListDef<NexusListableTypes>
  | NexusNonNullDef<NexusNonNullableTypes>
  | NexusNullDef<NexusNullableTypes>

export type NexusNonNullableTypes = AllNamedTypeDefs | NexusListDef<NexusListableTypes> | NexusArgDef<any>

export type NexusNullableTypes = AllNamedTypeDefs | NexusListDef<NexusListableTypes> | NexusArgDef<any>

export type AllNamedTypeDefs = GetGen<'allNamedTypes', string> | AllNexusNamedTypeDefs

export type AllNexusNamedArgsDefs<T extends AllInputTypes = AllInputTypes> =
  | T
  | NexusArgDef<T>
  | AllNexusNamedInputTypeDefs<T>

export type AllNexusArgsDefs =
  | AllNexusNamedArgsDefs
  | NexusListDef<any>
  | NexusNonNullDef<any>
  | NexusNullDef<any>

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

type NexusWrapKind = { type: 'List'; nullable: boolean } | { type: 'NamedType'; nullable: boolean }

export function unwrapNexusDef(
  typeDef: AllNexusTypeDefs | AllNexusArgsDefs | string,
  nonNullDefault: boolean
): { namedType: AllNexusNamedTypeDefs | AllNexusArgsDefs | string; wrapping: NexusWrapKind[] } {
  const wrapping: NexusWrapKind[] = []
  let namedType = typeDef

  const isNamedType = (obj: any): obj is AllNexusNamedTypeDefs | NexusArgDef<any> | string =>
    isNexusNamedTypeDef(obj) || isNexusArgDef(obj) || typeof obj === 'string'

  if (isNamedType(typeDef)) {
    return { namedType: typeDef, wrapping: [{ type: 'NamedType', nullable: !nonNullDefault }] }
  }

  while (isNexusWrappingType(namedType)) {
    // nullable(list(Type))
    if (isNexusNullTypeDef(namedType) && isNexusListTypeDef(namedType.ofType)) {
      wrapping.unshift({ type: 'List', nullable: true })
      namedType = namedType.ofType.ofType
    }

    // nullable(Type)
    if (isNexusNullTypeDef(namedType) && isNamedType(namedType.ofType)) {
      wrapping.unshift({ type: 'NamedType', nullable: true })
      namedType = namedType.ofType
      break
    }

    // nonNull(list(Type))
    if (isNexusNonNullTypeDef(namedType) && isNexusListTypeDef(namedType.ofType)) {
      wrapping.unshift({ type: 'List', nullable: false })
      namedType = namedType.ofType.ofType
    }

    // nonNull(Type)
    if (isNexusNonNullTypeDef(namedType) && isNamedType(namedType.ofType)) {
      wrapping.unshift({ type: 'NamedType', nullable: false })
      namedType = namedType.ofType
      break
    }

    // list(...)
    if (isNexusListTypeDef(namedType)) {
      wrapping.unshift({ type: 'List', nullable: !nonNullDefault })
      namedType = namedType.ofType
    }

    // Type
    if (!isNexusWrappingType(namedType)) {
      wrapping.unshift({ type: 'NamedType', nullable: !nonNullDefault })
    }
  }

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
  baseType: GraphQLNamedType,
  nonNullDefault: boolean
): GraphQLOutputType | GraphQLInputType {
  const { wrapping } = unwrapNexusDef(nexusDef, nonNullDefault)

  return wrapping.reduce<GraphQLType>((type, kind) => {
    if (kind.type === 'NamedType' && kind.nullable === false) {
      return GraphQLNonNull(type)
    }

    if (kind.type === 'List' && kind.nullable === true) {
      return GraphQLList(type)
    }

    if (kind.type === 'List' && kind.nullable === false) {
      return GraphQLNonNull(GraphQLList(type))
    }

    return type
  }, baseType)
}

export function wrapAsNexusType(
  baseType: AllNexusNamedTypeDefs | string,
  wrapping: NexusWrapKind[]
): AllNexusOutputTypeDefs
export function wrapAsNexusType(
  baseType: AllNexusNamedTypeDefs | string,
  wrapping: NexusWrapKind[]
): AllNexusInputTypeDefs
export function wrapAsNexusType(
  baseType: AllNexusNamedTypeDefs | string,
  wrapping: NexusWrapKind[]
): AllNexusTypeDefs {
  return wrapping.reduce<any>((type, kind) => {
    if (kind.type === 'NamedType' && kind.nullable === false) {
      return nonNull(type)
    }

    if (kind.type === 'List' && kind.nullable === true) {
      return list(type)
    }

    if (kind.type === 'List' && kind.nullable === false) {
      return nonNull(list(type))
    }

    return type
  }, baseType)
}
