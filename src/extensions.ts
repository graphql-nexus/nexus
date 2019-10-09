import { NexusOutputFieldConfig } from "./definitions/definitionBlocks";
import { NexusObjectTypeConfig } from "./definitions/objectType";
import { SchemaConfig, DynamicFieldDefs } from "./builder";
import { NexusInterfaceTypeConfig } from "./definitions/interfaceType";
import { RootTypings } from "./definitions/_types";

export type NexusTypeExtensions =
  | NexusObjectTypeExtension
  | NexusInterfaceTypeExtension;

export class NexusGenericExtension {
  constructor(readonly config: Record<string, any>) {}
}

/**
 * Container object living on `fieldDefinition.extensions.nexus`
 */
export class NexusFieldExtension<
  TypeName extends string = any,
  FieldName extends string = any
> {
  readonly config: Omit<NexusOutputFieldConfig<TypeName, FieldName>, "resolve">;
  /**
   * Whether the user has provided a custom "resolve" function,
   * or whether we're using the defaultResolver
   */
  readonly hasDefinedResolver: boolean;
  constructor(config: NexusOutputFieldConfig<TypeName, FieldName>) {
    const { resolve, ...rest } = config;
    this.config = rest;
    this.hasDefinedResolver = Boolean(resolve);
  }
}

/**
 * Container object living on `objectType.extensions.nexus`
 */
export class NexusObjectTypeExtension<TypeName extends string = any> {
  readonly config: Omit<NexusObjectTypeConfig<TypeName>, "definition">;
  constructor(config: NexusObjectTypeConfig<TypeName>) {
    const { definition, ...rest } = config;
    this.config = rest;
  }
}

/**
 * Container object living on `interfaceType.extensions.nexus`
 */
export class NexusInterfaceTypeExtension<TypeName extends string = any> {
  readonly config: Omit<NexusInterfaceTypeConfig<TypeName>, "definition">;
  constructor(config: NexusInterfaceTypeConfig<TypeName>) {
    const { definition, ...rest } = config;
    this.config = rest;
  }
}

export interface NexusSchemaExtensionConfig {
  config: Omit<SchemaConfig, "types">;
  dynamicFields: DynamicFieldDefs;
  rootTypings: RootTypings;
}

/**
 * Container object living on `schema.extensions.nexus`. Keeps track
 * of metadata from the builder so we can use it when we
 */
export class NexusSchemaExtension {
  readonly config: Omit<SchemaConfig, "types">;
  readonly dynamicFields: DynamicFieldDefs;
  readonly rootTypings: RootTypings;
  constructor(obj: NexusSchemaExtensionConfig) {
    this.config = obj.config;
    this.dynamicFields = obj.dynamicFields;
    this.rootTypings = obj.rootTypings;
  }
}
