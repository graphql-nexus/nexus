import {
  OutputDefinitionBlock,
  OutputDefinitionBuilder,
} from "./definitionBlocks";
import { GetGen2, GetGen, FieldResolver } from "../typegenTypeHelpers";
import { NonNullConfig, NexusTypes, withNexusSymbol, Omit } from "./_types";
import { assertValidName } from "graphql";
import { NexusInterfaceTypeDef } from "./interfaceType";

export type Implemented =
  | GetGen<"interfaceNames">
  | NexusInterfaceTypeDef<string>;

export interface FieldModification<
  TypeName extends string,
  FieldName extends string
> {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * The resolve method we should be resolving the field with
   */
  resolve?: FieldResolver<TypeName, FieldName>;
}

export interface FieldModificationDef<
  TypeName extends string,
  FieldName extends string
> extends FieldModification<TypeName, FieldName> {
  field: FieldName;
}

export interface ObjectDefinitionBuilder<TypeName extends string>
  extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void;
  addFieldModifications<FieldName extends string>(
    changes: FieldModificationDef<TypeName, FieldName>
  ): void;
}

export class ObjectDefinitionBlock<
  TypeName extends string
> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: ObjectDefinitionBuilder<TypeName>) {
    super(typeBuilder);
  }
  /**
   * @param interfaceName
   */
  implements(...interfaceName: Array<Implemented>) {
    this.typeBuilder.addInterfaces(interfaceName);
  }
  /**
   * Modifies a field added via an interface
   */
  modify<
    FieldName extends Extract<keyof GetGen2<"fieldTypes", TypeName>, string>
  >(field: FieldName, modifications: FieldModification<TypeName, FieldName>) {
    this.typeBuilder.addFieldModifications({ ...modifications, field });
  }
}

export interface NexusObjectTypeConfig<TypeName extends string> {
  name: TypeName;
  definition(t: ObjectDefinitionBlock<TypeName>): void;
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
   * Specifies a default field resolver for all members of this type.
   */
  defaultResolver?: FieldResolver<TypeName, any>;
}

export class NexusObjectTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusObjectTypeConfig<string>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusObjectTypeDef, NexusTypes.Object);

export function objectType<TypeName extends string>(
  config: NexusObjectTypeConfig<TypeName>
) {
  return new NexusObjectTypeDef(config.name, config);
}

export function queryType(
  config: Omit<NexusObjectTypeConfig<"Query">, "name">
) {
  return objectType({ ...config, name: "Query" });
}

export function mutationType(
  config: Omit<NexusObjectTypeConfig<"Mutation">, "name">
) {
  return objectType({ ...config, name: "Mutation" });
}
