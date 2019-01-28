import { OutputDefinitionBlock } from "./blocks";
import { wrappedType } from "./wrappedType";
import {
  AbstractResolveRoot,
  AbstractResolveReturn,
} from "../typegenTypeHelpers";
import { NexusTypes, MaybePromise } from "./_types";

export interface InterfaceTypeBase<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  resolveType(
    source: AbstractResolveRoot<GenTypes, TypeName>
  ): MaybePromise<AbstractResolveReturn<TypeName, GenTypes>>;
}

export interface InterfaceTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> extends InterfaceTypeBase<TypeName, GenTypes> {
  definition(t: OutputDefinitionBlock<TypeName, GenTypes>): void;
}

export type InterfaceTypeDef = ReturnType<typeof interfaceType>;

/**
 * Defines a GraphQLInterfaceType
 *
 * @see {}
 *
 * @param config
 */
export function interfaceType<TypeName extends string, GenTypes = NexusGen>(
  config: InterfaceTypeConfig<TypeName, GenTypes>
) {
  const { definition, ...rest } = config;
  const fields: any[] = [];
  definition(new OutputDefinitionBlock(fields));
  return wrappedType({
    nexus: NexusTypes.Interface as NexusTypes.Interface,
    fields,
    ...rest,
  });
}
