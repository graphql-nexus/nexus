import { assertValidName, GraphQLUnionTypeConfig } from 'graphql'
import { messages } from '../messages'
import { AbstractTypeResolver, GetGen } from '../typegenTypeHelpers'
import { NexusObjectTypeDef } from './objectType'
import { AbstractTypes, NexusTypes, SourceTypingDef, withNexusSymbol } from './_types'

export interface UnionDefinitionBuilder {
  typeName: string
  addUnionMembers(members: UnionMembers): void
  // TODO(tim): Remove before 1.0
  setLegacyResolveType(fn: AbstractTypeResolver<any>): void
}

export type UnionMembers = Array<GetGen<'objectNames'> | NexusObjectTypeDef<any>>

export class UnionDefinitionBlock {
  constructor(protected typeBuilder: UnionDefinitionBuilder) {}
  /**
   * All ObjectType names that should be part of the union, either as string names or as references to the
   * `objectType()` return value
   */
  members(...unionMembers: UnionMembers) {
    this.typeBuilder.addUnionMembers(unionMembers)
  }

  /* istanbul ignore next */
  protected resolveType(fn: AbstractTypeResolver<any>) {
    console.error(new Error(messages.removedResolveType(this.typeBuilder.typeName)))
    this.typeBuilder.setLegacyResolveType(fn)
  }
}

export type NexusUnionTypeConfig<TypeName extends string> = {
  /** The name of the union type */
  name: TypeName
  /** Builds the definition for the union */
  definition(t: UnionDefinitionBlock): void
  /** The description to annotate the GraphQL SDL */
  description?: string
  /**
   * Info about a field deprecation. Formatted as a string and provided with the deprecated directive on
   * field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
  /** Source type information for this type */
  sourceType?: SourceTypingDef
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLUnionTypeConfig<any, any>['extensions']
} & AbstractTypes.MaybeTypeDefConfigFieldResolveType<TypeName>

export class NexusUnionTypeDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusUnionTypeConfig<TypeName>) {
    assertValidName(name)
  }
  get value() {
    return this.config
  }
}

withNexusSymbol(NexusUnionTypeDef, NexusTypes.Union)

/**
 * Defines a new `GraphQLUnionType`
 *
 * @param config
 */
export function unionType<TypeName extends string>(config: NexusUnionTypeConfig<TypeName>) {
  return new NexusUnionTypeDef(config.name, config)
}
