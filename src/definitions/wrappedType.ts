import { NexusTypes } from "./_types";
import { assertValidName } from "graphql";

export interface WrappedTypeInfo {
  name: string;
  nexus: NexusTypes;
}

/**
 * The `wrappedType` exists to signify that the value returned from
 * the type construction APIs should not be used externally outside of the
 * builder function. It also is useful if you need the SchemaBuilder, in that
 * it can take a function which is lazy-evaluated to build the type.
 */
export function wrappedType<T extends WrappedTypeInfo>(
  config: T
): Readonly<T & { wrapped: typeof WrappedTypeSymbol }> {
  return {
    ...config,
    name: assertValidName(config.name),
    wrapped: WrappedTypeSymbol,
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
    wrapped: WrappedTypeSymbol,
  };
  return w as Readonly<typeof w>;
}

export const WrappedTypeSymbol = Symbol.for("@nexus/wrapped");
