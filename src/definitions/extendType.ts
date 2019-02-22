import { NexusTypes, withNexusSymbol } from "./_types";
import { OutputDefinitionBlock } from "./definitionBlocks";
import { assertValidName } from "graphql";
import { GetGen } from "../typegenTypeHelpers";

export interface NexusExtendTypeConfig<TypeName extends string> {
  type: TypeName;
  definition(t: OutputDefinitionBlock<TypeName>): void;
}

export class NexusExtendTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusExtendTypeConfig<string>
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
export function extendType<
  TypeName extends GetGen<"objectNames", string> | "Query" | "Mutation"
>(config: NexusExtendTypeConfig<TypeName>) {
  return new NexusExtendTypeDef(config.type, config);
}
