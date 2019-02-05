import { NexusTypes, NonNullConfig, withNexusSymbol } from "./_types";
import { InputDefinitionBlock } from "./definitionBlocks";
import { assertValidName } from "graphql";

export interface NexusInputObjectTypeConfig<TypeName extends string> {
  /**
   * Name of the input object type
   */
  name: TypeName;
  /**
   * Definition block for the input type
   */
  definition(t: InputDefinitionBlock<TypeName>): void;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nonNullDefaults?: NonNullConfig;
}

export class NexusInputObjectTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusInputObjectTypeConfig<string>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}
withNexusSymbol(NexusInputObjectTypeDef, NexusTypes.InputObject);

export function inputObjectType<TypeName extends string>(
  config: NexusInputObjectTypeConfig<TypeName>
) {
  return new NexusInputObjectTypeDef(config.name, config);
}
