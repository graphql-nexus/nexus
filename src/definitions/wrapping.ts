import { GraphQLNamedType } from 'graphql'
import { DynamicInputMethodDef, DynamicOutputMethodDef } from '../dynamicMethod'
import { DynamicOutputPropertyDef } from '../dynamicProperty'
import { NexusPlugin } from '../plugin'
import { AllInputTypes } from '../typegenTypeHelpers'
import { PrintedGenTyping, PrintedGenTypingImport } from '../utils'
import { NexusArgDef } from './args'
import { NexusEnumTypeDef } from './enumType'
import { NexusExtendInputTypeDef } from './extendInputType'
import { NexusExtendTypeDef } from './extendType'
import { NexusInputObjectTypeDef } from './inputObjectType'
import { NexusInterfaceTypeDef } from './interfaceType'
import { NexusObjectTypeDef } from './objectType'
import { NexusScalarTypeDef } from './scalarType'
import { NexusUnionTypeDef } from './unionType'
import { NexusTypes, NexusWrappedSymbol } from './_types'

export type AllNexusInputTypeDefs<T extends string = any> =
  | NexusInputObjectTypeDef<T>
  | NexusEnumTypeDef<T>
  | NexusScalarTypeDef<T>

export type AllNexusOutputTypeDefs =
  | NexusObjectTypeDef<any>
  | NexusInterfaceTypeDef<any>
  | NexusUnionTypeDef<any>
  | NexusEnumTypeDef<any>
  | NexusScalarTypeDef<any>

export type AllNexusNamedTypeDefs = AllNexusInputTypeDefs | AllNexusOutputTypeDefs

export type AllTypeDefs = AllNexusInputTypeDefs | AllNexusOutputTypeDefs | GraphQLNamedType

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
  return isNexusStruct(obj) && NamedTypeDefs.has(obj[NexusWrappedSymbol])
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
