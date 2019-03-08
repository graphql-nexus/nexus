import { GraphQLNamedType } from "graphql";
import { SchemaBuilder } from "../builder";
import { NexusEnumTypeDef } from "./enumType";
import { NexusExtendTypeDef } from "./extendType";
import { NexusInputObjectTypeDef } from "./inputObjectType";
import { NexusInterfaceTypeDef } from "./interfaceType";
import { NexusObjectTypeDef } from "./objectType";
import { NexusScalarTypeDef } from "./scalarType";
import { NexusUnionTypeDef } from "./unionType";
import { NexusTypes, NexusWrappedSymbol, withNexusSymbol } from "./_types";
import { NexusExtendInputTypeDef } from "./extendInputType";

export type AllNexusInputTypeDefs<T extends string = string> =
  | NexusInputObjectTypeDef<T>
  | NexusEnumTypeDef<T>
  | NexusScalarTypeDef<T>;

export type AllNexusOutputTypeDefs =
  | NexusObjectTypeDef<string>
  | NexusInterfaceTypeDef<string>
  | NexusUnionTypeDef<string>
  | NexusEnumTypeDef<string>
  | NexusScalarTypeDef<string>;

export type AllNexusNamedTypeDefs =
  | AllNexusInputTypeDefs
  | AllNexusOutputTypeDefs;

export type AllTypeDefs =
  | AllNexusInputTypeDefs
  | AllNexusOutputTypeDefs
  | GraphQLNamedType;

export type WrappedTypeFn<T extends AllNexusNamedTypeDefs> = (
  builder: SchemaBuilder
) => T;

/**
 * Container object for a "wrapped function"
 */
export class NexusWrappedType<T extends AllNexusNamedTypeDefs> {
  constructor(readonly name: string, protected wrappedFn: WrappedTypeFn<T>) {}
  get fn(): WrappedTypeFn<T> {
    return this.wrappedFn;
  }
}

withNexusSymbol(NexusWrappedType, NexusTypes.WrappedType);

/**
 * Useful primarily for plugins, where you want to delay the execution
 * of a block until other metadata exists from the root.
 *
 * @param fn
 */
export function nexusWrappedType<T extends AllNexusNamedTypeDefs>(
  name: string,
  fn: WrappedTypeFn<T>
) {
  return new NexusWrappedType(name, fn);
}

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
export function isNexusWrappedType(
  obj: any
): obj is NexusWrappedType<AllNexusNamedTypeDefs> {
  return (
    isNexusTypeDef(obj) && obj[NexusWrappedSymbol] === NexusTypes.WrappedType
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
