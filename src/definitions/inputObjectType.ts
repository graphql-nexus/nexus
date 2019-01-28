import { wrappedType } from "./wrappedType";
import { NexusTypes } from "./_types";
import { InputDefinitionBlock } from "./blocks";

export interface InputObjectTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  definition(t: InputDefinitionBlock<TypeName, GenTypes>): void;
}

export type InputObjectTypeDef = ReturnType<typeof inputObjectType>;

export function inputObjectType<TypeName extends string, GenTypes = NexusGen>(
  config: InputObjectTypeConfig<TypeName, GenTypes>
) {
  return wrappedType({
    nexus: NexusTypes.InputObject as NexusTypes.InputObject,
    ...config,
  });
}
