import { NexusTypes } from "./_types";
import { assertValidName } from "graphql";
import { EnumTypeDef } from "./enumType";
import { UnionTypeDef } from "./unionType";
import { ScalarTypeDef } from "./scalarType";
import { InputObjectTypeDef } from "./inputObjectType";
import { ObjectTypeDef } from "./objectType";
import { InterfaceTypeDef } from "./interfaceType";

export type Wrapped<T> = Readonly<T & { $wrapped: typeof NexusWrappedSymbol }>;

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
export function wrappedFn(fn: Function) {
  const w = {
    fn,
    nexus: NexusTypes.WrappedFn as NexusTypes.WrappedFn,
    $wrapped: NexusWrappedSymbol,
  };
  return w as Readonly<typeof w>;
}

export function isNexusWrappedFn(arg: any): boolean {
  return false;
}

export function wrappedArg<T>(arg: T): Wrapped<T> {
  return {
    ...arg,
    $wrapped: NexusWrappedSymbol,
  };
}

export const NexusWrappedSymbol = Symbol.for("@nexus/wrapped");

export type AllWrappedNamedTypes =
  | EnumTypeDef
  | UnionTypeDef
  | ScalarTypeDef
  | InputObjectTypeDef
  | ObjectTypeDef
  | InterfaceTypeDef;

// export function isNexusWrappedFn() obj is  {}

export function isNexusTypeDef(obj: any): obj is WrappedTypeInfo {
  return obj && obj.$wrapped === NexusWrappedSymbol;
}

const NamedTypeDefs = new Set([
  NexusTypes.Enum,
  NexusTypes.Object,
  NexusTypes.Scalar,
  NexusTypes.Union,
  NexusTypes.Interface,
]);

export function isNamedTypeDef(obj: any): obj is AllWrappedNamedTypes {
  return isNexusTypeDef(obj) && NamedTypeDefs.has(obj.nexus);
}
