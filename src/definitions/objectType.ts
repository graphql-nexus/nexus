import { assertValidName } from 'graphql'
import { InterfaceFieldsFor } from '../typegenTypeHelpers'
import { AbstractTypes, NexusTypes, NonNullConfig, Omit, RootTypingDef, withNexusSymbol } from './_types'
import { OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'
import { Implemented, FieldModificationDef, FieldModification } from './interfaceType'

export interface ObjectDefinitionBuilder extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void
  addModification(toAdd: FieldModificationDef<any, any>): void
}

export class ObjectDefinitionBlock<TypeName extends string> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: ObjectDefinitionBuilder) {
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
  modify<FieldName extends Extract<InterfaceFieldsFor<TypeName>, string>>(
    field: FieldName,
    modifications: FieldModification<TypeName, FieldName>
  ) {
    this.typeBuilder.addModification({ ...modifications, field })
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
} & AbstractTypes.MaybeTypeDefConfigFieldIsTypeOf<TypeName> &
  NexusGenPluginTypeConfig<TypeName>

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
