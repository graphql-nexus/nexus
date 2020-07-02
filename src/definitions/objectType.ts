import { assertValidName } from 'graphql'
import { FieldResolver, GetGen } from '../typegenTypeHelpers'
import { OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'
import { NexusInterfaceTypeDef } from './interfaceType'
import { NexusTypes, NonNullConfig, Omit, RootTypingDef, withNexusSymbol } from './_types'

export type Implemented = GetGen<'interfaceNames'> | NexusInterfaceTypeDef<any>

export interface FieldModification<TypeName extends string, FieldName extends string> {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * The resolve method we should be resolving the field with
   */
  resolve?: FieldResolver<TypeName, FieldName>
}

export interface FieldModificationDef<TypeName extends string, FieldName extends string>
  extends FieldModification<TypeName, FieldName> {
  field: FieldName
}

export interface ObjectDefinitionBuilder<TypeName extends string> extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void
}

export class ObjectDefinitionBlock<TypeName extends string> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: ObjectDefinitionBuilder<TypeName>) {
    super(typeBuilder)
  }
  /**
   * @param interfaceName
   */
  implements(...interfaceName: Array<Implemented>) {
    this.typeBuilder.addInterfaces(interfaceName)
  }
  /**
   * Modifies a field added via an interface
   */
  modify(field: any, modifications: any) {
    throw new Error(`
      The Nexus objectType.modify API has been removed. If you were using this API, please open an issue on 
      GitHub to discuss your use case so we can discuss a suitable replacement.
    `)
  }
}

export type NexusObjectTypeConfig<TypeName extends string> = {
  name: TypeName
  definition(t: ObjectDefinitionBlock<TypeName>): void
  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nonNullDefaults?: NonNullConfig
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef
} & NexusGenPluginTypeConfig<TypeName>

export class NexusObjectTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusObjectTypeConfig<TypeName>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusObjectTypeDef, NexusTypes.Object)

export function objectType<TypeName extends string>(config: NexusObjectTypeConfig<TypeName>) {
  return new NexusObjectTypeDef<TypeName>(config.name, config)
}

export function queryType(config: Omit<NexusObjectTypeConfig<'Query'>, 'name'>) {
  return objectType({ ...config, name: 'Query' })
}

export function mutationType(config: Omit<NexusObjectTypeConfig<'Mutation'>, 'name'>) {
  return objectType({ ...config, name: 'Mutation' })
}
