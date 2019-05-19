import {
  InputDefinitionBlock,
  OutputDefinitionBlock,
} from "./definitions/definitionBlocks";
import { withNexusSymbol, NexusTypes } from "./definitions/_types";
import { SchemaBuilder } from "./builder";

export type OutputFactoryConfig<T> = {
  args: any[];
  builder: SchemaBuilder;
  typeDef: OutputDefinitionBlock<any>;
};

export type InputFactoryConfig<T> = {
  args: any[];
  builder: SchemaBuilder;
  typeDef: InputDefinitionBlock<any>;
};

export interface BaseExtensionConfig<T extends string> {
  /**
   * The name of the "extension", the field made
   * available on the builders
   */
  name: T;
  /**
   * The full type definition for the options, including generic
   * signature for the type
   */
  typeDefinition?: string;
}

export interface DynamicOutputFieldConfig<T extends string>
  extends BaseExtensionConfig<T> {
  /**
   * Invoked when the field is called
   */
  factory(config: OutputFactoryConfig<T>): void;
}

export interface DynamicInputFieldConfig<T extends string>
  extends BaseExtensionConfig<T> {
  /**
   * Invoked when the field is called
   */
  factory(config: InputFactoryConfig<T>): void;
}

export class DynamicInputFieldDef<Name extends string> {
  constructor(
    readonly name: Name,
    protected config: DynamicInputFieldConfig<Name>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(DynamicInputFieldDef, NexusTypes.DynamicInput);

export class DynamicOutputFieldDef<Name extends string> {
  constructor(
    readonly name: Name,
    protected config: DynamicOutputFieldConfig<Name>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(DynamicOutputFieldDef, NexusTypes.DynamicOutput);

/**
 * Defines a new property on the object definition block
 * for an output type, taking arbitrary input to define
 * additional types.
 *
 * t.collection('posts', {
 *   nullable: true,
 *   totalCount(root, args, ctx, info) {
 *     return ctx.user.getTotalPostCount(root.id, args)
 *   },
 *   nodes(root, args, ctx, info) {
 *     return ctx.user.getPosts(root.id, args)
 *   }
 * })
 */
export function dynamicOutputField<T extends string>(
  config: DynamicOutputFieldConfig<T>
) {
  return new DynamicOutputFieldDef(config.name, config);
}

/**
 * Same as the outputFieldExtension, but for fields that
 * should be added on as input types.
 */
export function dynamicInputField<T extends string>(
  config: DynamicInputFieldConfig<T>
) {
  return new DynamicInputFieldDef(config.name, config);
}
