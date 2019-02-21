import { NexusTypes, withNexusSymbol } from "./_types";
import { InputDefinitionBlock } from "./definitionBlocks";
import { assertValidName } from "graphql";

export interface NexusExtendInputTypeConfig<TypeName extends string> {
  type: TypeName;
  definition(t: InputDefinitionBlock<TypeName>): void;
}

export class NexusExtendInputTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusExtendInputTypeConfig<string>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusExtendInputTypeDef, NexusTypes.ExtendInputObject);

/**
 * Adds new fields to an existing inputObjectType in the schema. Useful when
 * splitting your schema across several domains.
 *
 * @see http://graphql-nexus.com/api/extendType
 */
export function extendInputType<TypeName extends string>(
  config: NexusExtendInputTypeConfig<TypeName>
) {
  return new NexusExtendInputTypeDef(config.type, config);
}
