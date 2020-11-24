import { assertValidName } from 'graphql'
import { arg, NexusArgDef, NexusAsArgConfig } from './args'
import { InputDefinitionBlock } from './definitionBlocks'
import { NexusTypes, NonNullConfig, withNexusSymbol } from './_types'

export interface NexusInputObjectTypeConfig<TypeName extends string> {
  /**
   * Name of the input object type
   */
  name: TypeName
  /**
   * Definition block for the input type
   */
  definition(t: InputDefinitionBlock<TypeName>): void
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nonNullDefaults?: NonNullConfig
}

export class NexusInputObjectTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusInputObjectTypeConfig<any>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
  // FIXME
  // Instead of `any` we want to pass the name of this type...
  // so that the correct `cfg.default` type can be looked up
  // from the typegen.
  asArg(cfg?: NexusAsArgConfig<any>): NexusArgDef<any> {
    // FIXME
    return arg({ ...cfg, type: this } as any)
  }
}
withNexusSymbol(NexusInputObjectTypeDef, NexusTypes.InputObject)

export function inputObjectType<TypeName extends string>(config: NexusInputObjectTypeConfig<TypeName>) {
  return new NexusInputObjectTypeDef(config.name, config)
}
