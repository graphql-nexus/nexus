import { OutputDefinitionBlock, OutputDefinitionBuilder } from "./blocks";
import { GetGen2, GetGen, NexusFieldResolver } from "../typegenTypeHelpers";
import { NullabilityConfig, NexusTypes } from "./_types";
import { wrappedType, Wrapped } from "./wrappedType";
import { GraphQLInterfaceType } from "graphql";

export type Implemented<GenTypes = NexusGen> =
  | GetGen<GenTypes, "interfaceNames">
  | GraphQLInterfaceType
  | Wrapped<{ nexus: NexusTypes.Interface }>;

export interface ObjectDefinitionBuilder extends OutputDefinitionBuilder {
  addInterface(toAdd: Implemented): void;
}

export class ObjectDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBlock<TypeName, GenTypes> {
  constructor(protected typeBuilder: ObjectDefinitionBuilder) {
    super(typeBuilder);
  }

  /**
   * @param interfaceName
   */
  implements(...interfaceName: Array<Implemented>) {
    interfaceName.forEach((i) => this.typeBuilder.addInterface(i));
  }

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
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Specifies a default field resolver for all members of this type.
   * Warning: this may break type-safety.
   */
  defaultResolver?: NexusFieldResolver<TypeName, any, GenTypes>;
}

export type ObjectTypeDef = ReturnType<typeof objectType>;

export function objectType<TypeName extends string, GenTypes = NexusGen>(
  config: ObjectTypeConfig<TypeName, GenTypes>
) {
  return wrappedType({
    nexus: NexusTypes.Object as NexusTypes.Object,
    ...config,
  });
}
