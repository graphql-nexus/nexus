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
  /**
   * The name of the type this field is being declared on
   */
  typeName: string;
};

export type InputFactoryConfig<T> = {
  args: any[];
  builder: SchemaBuilder;
  typeDef: InputDefinitionBlock<any>;
  /**
   * The name of the type this field is being declared on
   */
  typeName: string;
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

export interface DynamicOutputMethodConfig<T extends string>
  extends BaseExtensionConfig<T> {
  /**
   * Invoked when the field is called
   */
  factory(config: OutputFactoryConfig<T>): any;
}

export interface DynamicInputMethodConfig<T extends string>
  extends BaseExtensionConfig<T> {
  /**
   * Invoked when the field is called
   */
  factory(config: InputFactoryConfig<T>): any;
}

export class DynamicInputMethodDef<Name extends string> {
  constructor(
    readonly name: Name,
    protected config: DynamicInputMethodConfig<Name>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(DynamicInputMethodDef, NexusTypes.DynamicInput);

export class DynamicOutputMethodDef<Name extends string> {
  constructor(
    readonly name: Name,
    protected config: DynamicOutputMethodConfig<Name>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(DynamicOutputMethodDef, NexusTypes.DynamicOutput);

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
export function dynamicOutputMethod<T extends string>(
  config: DynamicOutputMethodConfig<T>
) {
  return new DynamicOutputMethodDef(config.name, config);
}

/**
 * Same as the outputFieldExtension, but for fields that
 * should be added on as input types.
 */
export function dynamicInputMethod<T extends string>(
  config: DynamicInputMethodConfig<T>
) {
  return new DynamicInputMethodDef(config.name, config);
}
