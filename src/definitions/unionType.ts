import { assertValidName, GraphQLUnionTypeConfig } from 'graphql'
import type { GetGen } from '../typegenTypeHelpers'
import type { NexusObjectTypeDef } from './objectType'
import { AbstractTypes, Maybe, NexusTypes, SourceTypingDef, withNexusSymbol } from './_types'

export interface UnionDefinitionBuilder {
  typeName: string
  addUnionMembers(members: UnionMembers): void
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
}

export type NexusUnionTypeConfig<TypeName extends string> = {
  /** The name of the union type */
  name: TypeName
  /** Builds the definition for the union */
  definition(t: UnionDefinitionBlock): void
  /** The description to annotate the GraphQL SDL */
  description?: Maybe<string>
  /**
   * Info about a field deprecation. Formatted as a string and provided with the deprecated directive on
   * field/enum types and as a comment on input fields.
   */
  deprecation?: Maybe<string> // | DeprecationInfo;
  /** Source type information for this type */
  sourceType?: SourceTypingDef
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLUnionTypeConfig<any, any>['extensions']
  /** Adds this type as a method on the Object/Interface definition blocks */
  asNexusMethod?: string
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
 * [API Docs](https://nxs.li/docs/api/union-type) | [Abstract Types
 * Guide](https://nxs.li/guides/abstract-types) | [2018 GraphQL Spec](https://spec.graphql.org/June2018/#sec-Unions)
 *
 * Defines a Union type.
 *
 * Union types are one of the two abstract type in GraphQL. They let you express polymorphic fields where
 * members types can be totally different.
 *
 * @example
 *   export const Media = unionType({
 *     name: 'SearchResult',
 *     resolveType(source) {
 *       return 'director' in source ? 'Movie' : 'Song'
 *     },
 *     definition(t) {
 *       t.members('Movie', 'Song')
 *     },
 *   })
 *
 *   export const Movie = objectType({
 *     name: 'Movie',
 *     definition(t) {
 *       t.string('url')
 *       t.string('director')
 *     },
 *   })
 *
 *   export const Song = objectType({
 *     name: 'Song',
 *     definition(t) {
 *       t.string('url')
 *       t.string('album')
 *     },
 *   })
 *
 *   // GraphQL SDL
 *   // -----------
 *   //
 *   // union SearchResult = Movie | Song
 *   //
 *   // type Movie {
 *   //   director: String
 *   //   url: String
 *   // }
 *   //
 *   // type Song {
 *   //   album: String
 *   //   url: String
 *   // }
 *
 * @param config Specify your union's name, its members, and more. See each config property's jsDoc for more detail.
 */
export function unionType<TypeName extends string>(config: NexusUnionTypeConfig<TypeName>) {
  return new NexusUnionTypeDef(config.name, config)
}
