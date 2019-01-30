import { OutputDefinitionBlock, OutputDefinitionBuilder } from "./blocks";
import { GetGen2, GetGen, FieldResolver } from "../typegenTypeHelpers";
import { NonNullConfig, NexusTypes, withNexusSymbol } from "./_types";
import { assertValidName } from "graphql";
import { NexusInterfaceTypeDef } from "./interfaceType";

export type Implemented<GenTypes = NexusGen> =
  | GetGen<GenTypes, "interfaceNames">
  | NexusInterfaceTypeDef<string>;

export interface FieldModification<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * The resolve method we should be resolving the field with
   */
  resolve?: FieldResolver<TypeName, FieldName, GenTypes>;
}

export interface FieldModificationDef<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> extends FieldModification<TypeName, FieldName, GenTypes> {
  field: FieldName;
}

export interface ObjectDefinitionBuilder<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented<GenTypes>[]): void;
  addFieldModifications<FieldName extends string>(
    changes: FieldModificationDef<TypeName, FieldName, GenTypes>
  ): void;
}

export class ObjectDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBlock<TypeName, GenTypes> {
  constructor(
    protected typeBuilder: ObjectDefinitionBuilder<TypeName, GenTypes>
  ) {
    super(typeBuilder);
  }
  /**
   * @param interfaceName
   */
  implements(...interfaceName: Array<Implemented<GenTypes>>) {
    this.typeBuilder.addInterfaces(interfaceName);
  }
  /**
   * Modifies a field added via an interface
   */
  modify<
    FieldName extends Extract<
      keyof GetGen2<GenTypes, "fieldTypes", TypeName>,
      string
    >
  >(
    field: FieldName,
    modifications: FieldModification<TypeName, FieldName, GenTypes>
  ) {
    this.typeBuilder.addFieldModifications({ ...modifications, field });
  }
}

export interface NexusObjectTypeConfig<
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
  nonNullDefaults?: NonNullConfig;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Specifies a default field resolver for all members of this type.
   * Warning: this may break type-safety.
   */
  defaultResolver?: FieldResolver<TypeName, any, GenTypes>;
}

export class NexusObjectTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusObjectTypeConfig<any, any>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusObjectTypeDef, NexusTypes.Object);

export function objectType<TypeName extends string, GenTypes = NexusGen>(
  config: NexusObjectTypeConfig<TypeName, GenTypes>
) {
  return new NexusObjectTypeDef(config.name, config);
}
