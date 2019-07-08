import {
  OutputDefinitionBlock,
  OutputDefinitionBuilder,
} from "./definitionBlocks";
import { GetGen2, GetGen, FieldResolver } from "../typegenTypeHelpers";
import {
  NonNullConfig,
  NexusTypes,
  withNexusSymbol,
  Omit,
  RootTypingDef,
} from "./_types";
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

export interface ObjectDefinitionBuilder<TypeName extends string>
  extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void;
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

  modify<
    FieldName extends Extract<keyof GetGen2<"fieldTypes", TypeName>, string>
  >(field: FieldName, modifications: FieldModification<TypeName, FieldName>) {
    throw new Error(
      "This method has been removed, if you were using it - please open an issue so we can discuss a suitable API replacement"
    );
  }
}

export type NexusObjectTypeConfig<TypeName extends string> = {
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
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef;
} & NexusGenPluginTypeConfig<TypeName>;

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
