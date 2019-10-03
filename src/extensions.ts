import { NexusOutputFieldConfig } from "./definitions/definitionBlocks";
import { NexusObjectTypeConfig } from "./definitions/objectType";
import { SchemaConfig } from "./builder";
import { NexusInterfaceTypeConfig } from "./definitions/interfaceType";

/**
 * Container object living on `fieldDefinition.extensions.nexus`
 */
export class NexusFieldExtension<
  TypeName extends string = any,
  FieldName extends string = any
> {
  readonly fieldConfig: Omit<
    NexusOutputFieldConfig<TypeName, FieldName>,
    "resolve"
  >;
  /**
   * Whether the user has provided a custom "resolve" function,
   * or whether we're using the defaultResolver
   */
  readonly hasDefinedResolver: boolean;
  constructor(config: NexusOutputFieldConfig<TypeName, FieldName>) {
    const { resolve, ...rest } = config;
    this.fieldConfig = rest;
    this.hasDefinedResolver = Boolean(resolve);
  }
}

/**
 * Container object living on `objectType.extensions.nexus`
 */
export class NexusObjectTypeExtension<TypeName extends string = any> {
  readonly typeConfig: Omit<NexusObjectTypeConfig<TypeName>, "definition">;
  constructor(config: NexusObjectTypeConfig<TypeName>) {
    const { definition, ...rest } = config;
    this.typeConfig = rest;
  }
}

/**
 * Container object living on `interfaceType.extensions.nexus`
 */
export class NexusInterfaceTypeExtension<TypeName extends string = any> {
  readonly typeConfig: Omit<NexusInterfaceTypeConfig<TypeName>, "definition">;
  constructor(config: NexusInterfaceTypeConfig<TypeName>) {
    const { definition, ...rest } = config;
    this.typeConfig = rest;
  }
}

/**
 * Container object living on `schema.extensions.nexus`
 */
export class NexusSchemaExtension {
  readonly schemaConfig: Omit<SchemaConfig, "types">;
  constructor(config: SchemaConfig) {
    const { types, ...rest } = config;
    this.schemaConfig = rest;
  }
}
