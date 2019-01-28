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
  const { name, definition, ...rest } = config;
  const fields: any[] = [];
  definition(new InputDefinitionBlock(fields));
  return wrappedType({
    name,
    fields,
    nexus: NexusTypes.InputObject as NexusTypes.InputObject,
    ...rest,
  });
}
