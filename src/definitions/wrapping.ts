import {
  GraphQLInputType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLOutputType,
  GraphQLType,
} from 'graphql'
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
import { list, NexusListDef } from './list'
import { NexusNonNullDef, nonNull } from './nonNull'
import { NexusNullDef, nullable } from './nullable'
import { NexusObjectTypeDef } from './objectType'
import { NexusScalarTypeDef } from './scalarType'
import { NexusUnionTypeDef } from './unionType'
import { NexusTypes, NexusWrappedSymbol } from './_types'

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
