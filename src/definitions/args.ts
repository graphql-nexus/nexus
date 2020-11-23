import { AllInputTypes, GetGen2 } from '../typegenTypeHelpers'
import { AllNexusArgsDefs, AllNexusInputTypeDefs } from './wrapping'
import { NexusTypes, withNexusSymbol } from './_types'

export type ArgsRecord = Record<string, AllNexusArgsDefs>

export type CommonArgConfig = {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
} & NexusGenPluginArgConfig

export interface ScalarArgConfig<T> extends CommonArgConfig {
  /**
   * Configure the default for the object
   */
  default?: T
}

export type NexusArgConfigType<T extends AllInputTypes> = T | AllNexusInputTypeDefs<T>

export interface NexusAsArgConfig<T extends AllInputTypes> extends CommonArgConfig {
  /**
   * Configure the default for the object
   */
  default?: GetGen2<'allTypes', T> // TODO: Make this type-safe somehow
}

export interface NexusArgConfig<T extends AllInputTypes> extends NexusAsArgConfig<T> {
  /**
   * The type of the argument, either the string name of the type,
   * or the concrete Nexus type definition
   */
  type: NexusArgConfigType<T>
}

export interface NexusFinalArgConfig extends NexusArgConfig<any> {
  configFor: 'arg'
  argName: string
  fieldName: string
  parentType: string
}

export class NexusArgDef<TypeName extends AllInputTypes> {
  constructor(readonly name: string, protected config: NexusArgConfig<TypeName>) {}
  get value() {
    return this.config
  }
}
withNexusSymbol(NexusArgDef, NexusTypes.Arg)

/**
 * Defines an argument that can be used in any object or interface type
 *
 * Takes the GraphQL type name and any options.
 *
 * The value returned from this argument can be used multiple times in any valid `args` object value
 *
 * @see https://graphql.github.io/learn/schema/#arguments
 */
export function arg<T extends AllInputTypes>(options: NexusArgConfig<T>) {
  if (!options.type) {
    throw new Error('You must provide a "type" for the arg()')
  }
  return new NexusArgDef(
    typeof options.type === 'string' ? options.type : (options.type as any).name,
    options
  )
}
export function stringArg(options?: ScalarArgConfig<string>) {
  return arg({ type: 'String', ...options })
}
export function intArg(options?: ScalarArgConfig<number>) {
  return arg({ type: 'Int', ...options })
}
export function floatArg(options?: ScalarArgConfig<number>) {
  return arg({ type: 'Float', ...options })
}
export function idArg(options?: ScalarArgConfig<string>) {
  return arg({ type: 'ID', ...options })
}
export function booleanArg(options?: ScalarArgConfig<boolean>) {
  return arg({ type: 'Boolean', ...options })
}
