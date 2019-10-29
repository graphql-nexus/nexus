import { GraphQLNamedType } from "graphql";
import { NexusEnumTypeDef } from "./enumType";
import { NexusExtendTypeDef } from "./extendType";
import { NexusInputObjectTypeDef } from "./inputObjectType";
import { NexusInterfaceTypeDef } from "./interfaceType";
import { NexusObjectTypeDef } from "./objectType";
import { NexusScalarTypeDef } from "./scalarType";
import { NexusUnionTypeDef } from "./unionType";
import { NexusTypes, NexusWrappedSymbol } from "./_types";
import { NexusExtendInputTypeDef } from "./extendInputType";
import {
  DynamicOutputMethodDef,
  DynamicInputMethodDef,
} from "../dynamicMethod";
import { NexusArgDef } from "./args";
import { DynamicOutputPropertyDef } from "../dynamicProperty";
import { AllInputTypes } from "../typegenTypeHelpers";
import { PrintedGenTyping, PrintedGenTypingImport } from "../utils";

export type AllNexusInputTypeDefs<T extends string = any> =
  | NexusInputObjectTypeDef<T>
  | NexusEnumTypeDef<T>
  | NexusScalarTypeDef<T>;

export type AllNexusOutputTypeDefs =
  | NexusObjectTypeDef<any>
  | NexusInterfaceTypeDef<any>
  | NexusUnionTypeDef<any>
  | NexusEnumTypeDef<any>
  | NexusScalarTypeDef<any>;

export type AllNexusNamedTypeDefs =
  | AllNexusInputTypeDefs
  | AllNexusOutputTypeDefs;

export type AllTypeDefs =
  | AllNexusInputTypeDefs
  | AllNexusOutputTypeDefs
  | GraphQLNamedType;

const NamedTypeDefs = new Set([
  NexusTypes.Enum,
  NexusTypes.Object,
  NexusTypes.Scalar,
  NexusTypes.Union,
  NexusTypes.Interface,
  NexusTypes.InputObject,
]);

export function isNexusTypeDef(
  obj: any
): obj is { [NexusWrappedSymbol]: NexusTypes } {
  return obj && Boolean(obj[NexusWrappedSymbol]);
}
export function isNexusNamedTypeDef(obj: any): obj is AllNexusNamedTypeDefs {
  return isNexusTypeDef(obj) && NamedTypeDefs.has(obj[NexusWrappedSymbol]);
}
export function isNexusExtendInputTypeDef(
  obj: any
): obj is NexusExtendInputTypeDef<string> {
  return (
    isNexusTypeDef(obj) &&
    obj[NexusWrappedSymbol] === NexusTypes.ExtendInputObject
  );
}
export function isNexusExtendTypeDef(
  obj: any
): obj is NexusExtendTypeDef<string> {
  return (
    isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.ExtendObject
  );
}

export function isNexusEnumTypeDef(obj: any): obj is NexusEnumTypeDef<string> {
  return isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Enum;
}
export function isNexusInputObjectTypeDef(
  obj: any
): obj is NexusInputObjectTypeDef<string> {
  return (
    isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.InputObject
  );
}
export function isNexusObjectTypeDef(
  obj: any
): obj is NexusObjectTypeDef<string> {
  return isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Object;
}
export function isNexusScalarTypeDef(
  obj: any
): obj is NexusScalarTypeDef<string> {
  return isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Scalar;
}
export function isNexusUnionTypeDef(
  obj: any
): obj is NexusUnionTypeDef<string> {
  return isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Union;
}
export function isNexusInterfaceTypeDef(
  obj: any
): obj is NexusInterfaceTypeDef<string> {
  return (
    isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Interface
  );
}
export function isNexusArgDef(obj: any): obj is NexusArgDef<AllInputTypes> {
  return isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.Arg;
}

export function isNexusDynamicOutputProperty<T extends string>(
  obj: any
): obj is DynamicOutputPropertyDef<T> {
  return (
    isNexusTypeDef(obj) &&
    obj[NexusWrappedSymbol] === NexusTypes.DynamicOutputProperty
  );
}
export function isNexusDynamicOutputMethod<T extends string>(
  obj: any
): obj is DynamicOutputMethodDef<T> {
  return (
    isNexusTypeDef(obj) &&
    obj[NexusWrappedSymbol] === NexusTypes.DynamicOutputMethod
  );
}
export function isNexusDynamicInputMethod<T extends string>(
  obj: any
): obj is DynamicInputMethodDef<T> {
  return (
    isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.DynamicInput
  );
}
export function isNexusPrintedGenTyping(obj: any): obj is PrintedGenTyping {
  return (
    isNexusTypeDef(obj) &&
    obj[NexusWrappedSymbol] === NexusTypes.PrintedGenTyping
  );
}
export function isNexusPrintedGenTypingImport(
  obj: any
): obj is PrintedGenTypingImport {
  return (
    isNexusTypeDef(obj) &&
    obj[NexusWrappedSymbol] === NexusTypes.PrintedGenTypingImport
  );
}
