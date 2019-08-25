import { withNexusSymbol, NexusTypes } from "./definitions/_types";
import { BaseExtensionConfig } from "./dynamicMethod";
import { SchemaBuilder } from "./builder";
import {
  OutputDefinitionBlock,
  InputDefinitionBlock,
} from "./definitions/definitionBlocks";

//
// Ouput
//

export type OutputPropertyFactoryConfig<T> = {
  builder: SchemaBuilder;
  typeDef: OutputDefinitionBlock<any>;
  /**
   * The name of the type this field is being declared on
   */
  typeName: string;
};

export interface DynamicOutputPropertyConfig<T extends string>
  extends BaseExtensionConfig<T> {
  /**
   * Invoked when the property is accessed (as a getter)
   */
  factory(config: OutputPropertyFactoryConfig<T>): any;
}

export class DynamicOutputPropertyDef<Name extends string> {
  constructor(
    readonly name: Name,
    protected config: DynamicOutputPropertyConfig<Name>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(DynamicOutputPropertyDef, NexusTypes.DynamicOutputMethod);

/**
 * Defines a new property on the object definition block
 * for an output type, making it possible to build custom DSL's
 * on top of Nexus, e.g. in nexus-prisma
 *
 * t.model.posts()
 */
export function dynamicOutputProperty<T extends string>(
  config: DynamicOutputPropertyConfig<T>
) {
  return new DynamicOutputPropertyDef(config.name, config);
}

//
// Input
//

export type InputFactoryConfig<T> = {
  args: any[];
  builder: SchemaBuilder;
  typeDef: InputDefinitionBlock<any>;
  /**
   * The name of the type this field is being declared on
   */
  typeName: string;
};

export type InputConfig<T extends string> = BaseExtensionConfig<T> & {
  /**
   * Invoked when the property is accessed (as a getter)
   */
  factory(config: InputFactoryConfig<T>): any;
};

export class DynamicInputPropertyDef<Name extends string> {
  constructor(readonly name: Name, protected config: InputConfig<Name>) {}
  get value() {
    return this.config;
  }
}

/**
 * Same as the outputFieldExtension, but for fields that
 * should be added on as input types.
 */
export function dynamicInputProperty<T extends string>(config: InputConfig<T>) {
  return new DynamicInputPropertyDef(config.name, config);
}
