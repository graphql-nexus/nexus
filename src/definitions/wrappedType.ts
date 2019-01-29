import { NexusTypes } from "./_types";
import { assertValidName } from "graphql";
import { EnumTypeDef } from "./enumType";
import { UnionTypeDef } from "./unionType";
import { ScalarTypeDef } from "./scalarType";
import { InputObjectTypeDef } from "./inputObjectType";
import { ObjectTypeDef } from "./objectType";
import { InterfaceTypeDef } from "./interfaceType";
import { ExtendTypeDef } from "./extendType";

export type Wrapped<T> = Readonly<T & { $wrapped: typeof NexusWrappedSymbol }>;

export type WrappedInput = Wrapped<{
  nexus: NexusTypes.Enum | NexusTypes.Scalar | NexusTypes.InputObject;
}>;

export type WrappedOutput = Wrapped<{
  nexus:
    | NexusTypes.Enum
    | NexusTypes.Interface
    | NexusTypes.Object
    | NexusTypes.Union;
}>;

export interface WrappedTypeInfo {
  nexus: NexusTypes;
  name: string;
}

/**
 * The `wrappedType` exists to signify that the value returned from
 * the type construction APIs should not be used externally outside of the
 * builder function. It also is useful if you need the SchemaBuilder, in that
 * it can take a function which is lazy-evaluated to build the type.
 */
export function wrappedType<T extends WrappedTypeInfo>(config: T): Wrapped<T> {
  return {
    ...config,
    name: assertValidName(config.name),
    $wrapped: NexusWrappedSymbol,
  };
}

/**
 * Useful if you want to encapsulate
 * @param fn
 */
export function nexusWrappedFn(fn: Function) {
  const w = {
    fn,
    nexus: NexusTypes.WrappedFn as NexusTypes.WrappedFn,
    $wrapped: NexusWrappedSymbol,
  };
  return w as Readonly<typeof w>;
}

export type WrappedFn = ReturnType<typeof nexusWrappedFn>;

export function nexusWrappedArg<T>(arg: T): Wrapped<T> {
  return {
    ...arg,
    $wrapped: NexusWrappedSymbol,
  };
}

export const NexusWrappedSymbol = Symbol.for("@nexus/wrapped");

export type AllWrappedNamedTypes =
  | UnionTypeDef
  | ObjectTypeDef
  | InterfaceTypeDef
  | EnumTypeDef<any>
  | ScalarTypeDef<any>
  | InputObjectTypeDef<any>;

export type InputTypeDefs =
  | InputObjectTypeDef<any>
  | EnumTypeDef<any>
  | ScalarTypeDef<any>;

export type OuputTypeDefs =
  | ObjectTypeDef
  | InterfaceTypeDef
  | UnionTypeDef
  | ScalarTypeDef<any>
  | EnumTypeDef<any>;

const NamedTypeDefs = new Set([
  NexusTypes.Enum,
  NexusTypes.Object,
  NexusTypes.Scalar,
  NexusTypes.Union,
  NexusTypes.Interface,
]);

export function isNexusTypeDef(obj: any): obj is WrappedTypeInfo {
  return obj && obj.$wrapped === NexusWrappedSymbol;
}

export function isNexusNamedTypeDef(obj: any): obj is AllWrappedNamedTypes {
  return isNexusTypeDef(obj) && NamedTypeDefs.has(obj.nexus);
}

export function isNexusExtendTypeDef(obj: any): obj is ExtendTypeDef {
  return isNexusTypeDef(obj) && obj.nexus === NexusTypes.ExtendObject;
}

export function isNexusWrappedFn(obj: any): obj is WrappedFn {
  return isNexusTypeDef(obj) && obj.name === NexusTypes.WrappedFn;
}
