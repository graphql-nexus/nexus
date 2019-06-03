import {
  OutputDefinitionBlock,
  AbstractOutputDefinitionBuilder,
} from "./definitionBlocks";
import {
  NexusTypes,
  NonNullConfig,
  withNexusSymbol,
  RootTypingDef,
} from "./_types";
import { assertValidName } from "graphql";
import { AbstractTypeResolver } from "../typegenTypeHelpers";

export type NexusInterfaceTypeConfig<TypeName extends string> = {
  name: TypeName;

  // Really wanted to keep this here, but alas, it looks like there's some
  // issues around inferring the generic.
  // https://github.com/Microsoft/TypeScript/pull/29478
  // https://github.com/Microsoft/TypeScript/issues/10195
  //
  // resolveType: AbstractTypeResolver<TypeName>;

  definition(t: InterfaceDefinitionBlock<TypeName>): void;
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nonNullDefaults?: NonNullConfig;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef;
};

export class InterfaceDefinitionBlock<
  TypeName extends string
> extends OutputDefinitionBlock<TypeName> {
  constructor(
    protected typeBuilder: AbstractOutputDefinitionBuilder<TypeName>
  ) {
    super(typeBuilder);
  }
  /**
   * Sets the "resolveType" method for the current type.
   */
  resolveType(fn: AbstractTypeResolver<TypeName>) {
    this.typeBuilder.setResolveType(fn);
  }
}

export class NexusInterfaceTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusInterfaceTypeConfig<string>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusInterfaceTypeDef, NexusTypes.Interface);

/**
 * Defines a GraphQLInterfaceType
 * @param config
 */
export function interfaceType<TypeName extends string>(
  config: NexusInterfaceTypeConfig<TypeName>
) {
  return new NexusInterfaceTypeDef(config.name, config);
}
