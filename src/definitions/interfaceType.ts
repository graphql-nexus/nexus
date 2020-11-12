import { assertValidName } from 'graphql'
import { GetGen, AbstractTypes } from '../typegenTypeHelpers'
import { NexusTypes, NonNullConfig, RootTypingDef, withNexusSymbol } from './_types'
import { OutputDefinitionBlock, OutputDefinitionBuilder } from './definitionBlocks'

export type Implemented = GetGen<'interfaceNames'> | NexusInterfaceTypeDef<any>

export type NexusInterfaceTypeConfig<TypeName extends string> = {
  name: TypeName

  // Really wanted to keep this here, but alas, it looks like there's some
  // issues around inferring the generic.
  // https://github.com/Microsoft/TypeScript/pull/29478
  // https://github.com/Microsoft/TypeScript/issues/10195
  //
  // resolveType: AbstractTypeResolver<TypeName>;

  definition(t: InterfaceDefinitionBlock<TypeName>): void
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
} & AbstractTypes.MaybeTypeDefConfigFieldResolveType<TypeName>

export interface InterfaceDefinitionBuilder<TypeName extends string> extends OutputDefinitionBuilder {
  addInterfaces(toAdd: Implemented[]): void
}

export class InterfaceDefinitionBlock<TypeName extends string> extends OutputDefinitionBlock<TypeName> {
  constructor(protected typeBuilder: InterfaceDefinitionBuilder<TypeName>) {
    super(typeBuilder)
  }
  /**
   * @param interfaceName
   */
  implements(...interfaceName: Array<Implemented>) {
    this.typeBuilder.addInterfaces(interfaceName)
  }
}

export class NexusInterfaceTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusInterfaceTypeConfig<TypeName>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusInterfaceTypeDef, NexusTypes.Interface)

/**
 * Defines a GraphQLInterfaceType
 * @param config
 */
export function interfaceType<TypeName extends string>(config: NexusInterfaceTypeConfig<TypeName>) {
  return new NexusInterfaceTypeDef<TypeName>(config.name, config)
}
