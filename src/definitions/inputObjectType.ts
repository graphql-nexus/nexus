import { wrappedType } from "./wrappedType";
import { NexusTypes, NonNullConfig } from "./_types";
import { InputDefinitionBlock } from "./blocks";

export interface InputObjectTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  /**
   * Name of the input object type
   */
  name: TypeName;
  /**
   * Definition block for the input type
   */
  definition(t: InputDefinitionBlock<TypeName, GenTypes>): void;
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
  nullability?: NonNullConfig;
}

export type InputObjectTypeDef<T> = ReturnType<typeof inputObjectType>;

export function inputObjectType<TypeName extends string, GenTypes = NexusGen>(
  config: InputObjectTypeConfig<TypeName, GenTypes>
) {
  return wrappedType({
    nexus: NexusTypes.InputObject as NexusTypes.InputObject,
    ...config,
  });
}
