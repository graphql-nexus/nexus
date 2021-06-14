import type { SchemaBuilder } from './builder'
import type { OutputDefinitionBlock } from './definitions/definitionBlocks'
import { NexusTypes, withNexusSymbol } from './definitions/_types'
import type { BaseExtensionConfig } from './dynamicMethod'

export type OutputPropertyFactoryConfig<T> = {
  stage: 'walk' | 'build'
  builder: SchemaBuilder
  typeDef: OutputDefinitionBlock<any>
  /** The name of the type this field is being declared on */
  typeName: string
}

export interface DynamicOutputPropertyConfig<T extends string> extends BaseExtensionConfig<T> {
  /** Invoked when the property is accessed (as a getter) */
  factory(config: OutputPropertyFactoryConfig<T>): any
}

export class DynamicOutputPropertyDef<Name extends string> {
  constructor(readonly name: Name, protected config: DynamicOutputPropertyConfig<Name>) {}
  get value() {
    return this.config
  }
}
withNexusSymbol(DynamicOutputPropertyDef, NexusTypes.DynamicOutputProperty)

/**
 * Defines a new property on the object definition block for an output type, making it possible to build
 * custom DSL's on top of Nexus, e.g. in nexus-prisma
 *
 * T.model.posts()
 */
export function dynamicOutputProperty<T extends string>(config: DynamicOutputPropertyConfig<T>) {
  return new DynamicOutputPropertyDef(config.name, config)
}
