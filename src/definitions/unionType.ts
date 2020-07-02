import { assertValidName } from 'graphql'
import { AbstractTypeResolver, GetGen } from '../typegenTypeHelpers'
import { NexusObjectTypeDef } from './objectType'
import { NexusTypes, RootTypingDef, withNexusSymbol } from './_types'

export interface UnionDefinitionBuilder<TypeName extends string> {
  setResolveType(fn: AbstractTypeResolver<TypeName>): void
  addUnionMembers(members: UnionMembers): void
}

export type UnionMembers = Array<GetGen<'objectNames'> | NexusObjectTypeDef<any>>

export class UnionDefinitionBlock<TypeName extends string> {
  constructor(protected typeBuilder: UnionDefinitionBuilder<TypeName>) {}
  /**
   * All ObjectType names that should be part of the union, either
   * as string names or as references to the `objectType()` return value
   */
  members(...unionMembers: UnionMembers) {
    this.typeBuilder.addUnionMembers(unionMembers)
  }
  /**
   * Sets the "resolveType" method for the current union
   */
  resolveType(fn: AbstractTypeResolver<TypeName>) {
    this.typeBuilder.setResolveType(fn)
  }
}

export interface NexusUnionTypeConfig<TypeName extends string> {
  /**
   * The name of the union type
   */
  name: TypeName
  /**
   * Builds the definition for the union
   */
  definition(t: UnionDefinitionBlock<TypeName>): void
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef
}

export class NexusUnionTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusUnionTypeConfig<string>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusUnionTypeDef, NexusTypes.Union)

/**
 * Defines a new `GraphQLUnionType`
 * @param config
 */
export function unionType<TypeName extends string>(config: NexusUnionTypeConfig<TypeName>) {
  return new NexusUnionTypeDef(config.name, config)
}
