import { assertValidName, GraphQLInputObjectTypeConfig } from 'graphql'
import { arg, NexusArgDef, NexusAsArgConfig } from './args'
import type { InputDefinitionBlock } from './definitionBlocks'
import { NexusTypes, NonNullConfig, withNexusSymbol } from './_types'

export type NexusInputObjectTypeConfig<TypeName extends string> = {
  /** Name of the input object type */
  name: TypeName
  /** Definition block for the input type */
  definition(t: InputDefinitionBlock<TypeName>): void
  /** The description to annotate the GraphQL SDL */
  description?: string
  /**
   * Configures the nullability for the type, check the documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration on nullability.
   */
  nonNullDefaults?: NonNullConfig
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLInputObjectTypeConfig['extensions']
} & NexusGenPluginInputTypeConfig<TypeName>

export class NexusInputObjectTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusInputObjectTypeConfig<any>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
  /**
   * Shorthand for wrapping the current InputObject in an "arg", useful if you need to add a description.
   *
   * @example
   *   inputObject(config).asArg({
   *     description: 'Define sort the current field',
   *   })
   */
  asArg(cfg?: NexusAsArgConfig<TypeName>): NexusArgDef<any> {
    return arg({ ...cfg, type: this })
  }
}
withNexusSymbol(NexusInputObjectTypeDef, NexusTypes.InputObject)

export function inputObjectType<TypeName extends string>(config: NexusInputObjectTypeConfig<TypeName>) {
  return new NexusInputObjectTypeDef(config.name, config)
}
