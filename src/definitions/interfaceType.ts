import {
  OutputDefinitionBlock,
  AbstractOutputDefinitionBuilder,
} from "./blocks";
import { wrappedType } from "./wrappedType";
import { NexusTypes, NonNullConfig } from "./_types";
import { AbstractTypeResolver } from "../core";

// export interface SetResolveType<TypeName extends string, GenTypes = NexusGen> {
//   setResolveType(fn: AbstractTypeResolver<TypeName, GenTypes>): void;
// }

export type InterfaceTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> = {
  name: TypeName;

  // Really wanted to keep this here, but alas, it looks like there's some
  // issues around inferring the generic.
  // https://github.com/Microsoft/TypeScript/pull/29478
  // https://github.com/Microsoft/TypeScript/issues/10195
  //
  // resolveType: AbstractTypeResolver<TypeName, GenTypes>;

  definition(t: InterfaceDefinitionBlock<TypeName, GenTypes>): void;
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nullability?: NonNullConfig;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
};

export type InterfaceTypeDef = ReturnType<typeof interfaceType>;

export class InterfaceDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBlock<TypeName, GenTypes> {
  constructor(
    protected typeBuilder: AbstractOutputDefinitionBuilder<TypeName, GenTypes>
  ) {
    super(typeBuilder);
  }
  /**
   * Sets the "resolveType" method for the current type.
   */
  resolveType(fn: AbstractTypeResolver<TypeName, GenTypes>) {
    this.typeBuilder.setResolveType(fn);
  }
}

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
