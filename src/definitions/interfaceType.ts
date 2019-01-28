import { AbstractOutputDefinitionBlock } from "./blocks";
import { wrappedType } from "./wrappedType";
import { NexusTypes, NullabilityConfig } from "./_types";

export interface InterfaceTypeBase<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;

  // Really wanted to keep this here, but alas:
  //
  // resolveType(
  //   source: AbstractResolveRoot<GenTypes, TypeName>
  // ): MaybePromise<AbstractResolveReturn<TypeName, GenTypes> | null>;
}

export interface InterfaceTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> extends InterfaceTypeBase<TypeName, GenTypes> {
  definition(t: AbstractOutputDefinitionBlock<TypeName, GenTypes>): void;
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nullability?: NullabilityConfig;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
}

export type InterfaceTypeDef = ReturnType<typeof interfaceType>;

/**
 * Defines a GraphQLInterfaceType
 *
 * @param config
 */
export function interfaceType<TypeName extends string, GenTypes = NexusGen>(
  config: InterfaceTypeConfig<TypeName, GenTypes>
) {
  return wrappedType({
    nexus: NexusTypes.Interface as NexusTypes.Interface,
    ...config,
  });
}
