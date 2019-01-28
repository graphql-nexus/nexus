import { wrappedType } from "./wrappedType";
import { NexusTypes } from "./_types";
import { OutputDefinitionBlock } from "./blocks";

export interface ExtendTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  type: TypeName;
  definition(t: OutputDefinitionBlock<TypeName, GenTypes>): void;
}

export type ExtendTypeDef = ReturnType<typeof extendType>;

/**
 * Adds new fields to an existing type in the schema. Useful when splitting your
 * schema across several domains.
 *
 * @see http://graphql-nexus.com/api/extendType
 */
export function extendType<TypeName extends string>(
  config: ExtendTypeConfig<TypeName>
) {
  const { type, ...rest } = config;
  return wrappedType({
    name: type,
    nexus: NexusTypes.ExtendObject as NexusTypes.ExtendObject,
    ...rest,
  });
}
