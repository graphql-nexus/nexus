import { OutputDefinitionBlock } from "./blocks";
import { GetGen2, GetGen } from "../typegenTypeHelpers";
import { NullabilityConfig, NexusTypes, MaybeThunk } from "./_types";
import { wrappedType } from "./wrappedType";
import { GraphQLInterfaceType } from "graphql";

export class ObjectDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBlock<TypeName, GenTypes> {
  /**
   *
   * @param interfaceName
   */
  implements(
    ...interfaceName: Array<
      GetGen<GenTypes, "interfaceNames"> | GraphQLInterfaceType
    >
  ) {}
  /**
   * Modifies a field added via an interface
   */
  modify<
    FieldName extends Extract<
      keyof GetGen2<GenTypes, "returnTypes", TypeName>,
      string
    >
  >() {}
}

export interface ObjectTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  definition(t: ObjectDefinitionBlock<TypeName, GenTypes>): void;
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nullability?: NullabilityConfig;
  /**
   * Specifies a default field resolver for all members of this type.
   * Warning: this may break type-safety.
   */
  defaultResolver?: any;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
}

export type ObjectTypeDef = ReturnType<typeof objectType>;

export function objectType<TypeName extends string, GenTypes = NexusGen>(
  config: ObjectTypeConfig<TypeName, GenTypes>
) {
  const { definition, ...rest } = config;
  const fields: any[] = [];
  const factory = new OutputDefinitionBlock<TypeName, GenTypes>(fields);
  definition(factory);
  return wrappedType({
    nexus: NexusTypes.Object as NexusTypes.Object,
    fields,
    ...rest,
  });
}
