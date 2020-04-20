import { assertValidName } from "graphql";
import { AllOutputTypesPossible } from "../typegenTypeHelpers";
import { OutputDefinitionBlock } from "./definitionBlocks";
import { NexusTypes, withNexusSymbol, NonNullConfig } from "./_types";

export interface NexusExtendTypeConfig<TypeName extends string> {
  type: TypeName;
  definition(t: OutputDefinitionBlock<TypeName>): void;
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
}

export class NexusExtendTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusExtendTypeConfig<TypeName> & { name: TypeName }
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusExtendTypeDef, NexusTypes.ExtendObject);

/**
 * Adds new fields to an existing objectType in the schema. Useful when
 * splitting your schema across several domains.
 *
 * @see http://graphql-nexus.com/api/extendType
 */
export function extendType<TypeName extends AllOutputTypesPossible>(
  config: NexusExtendTypeConfig<TypeName>
) {
  return new NexusExtendTypeDef(config.type, { ...config, name: config.type });
}
