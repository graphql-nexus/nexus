import type { GraphQLResolveInfo } from 'graphql'
import type { Maybe } from './definitions/_types'
import type {
  AbstractTypeResolver,
  GetGen,
  GetGen2,
  IsFeatureEnabled2,
  MaybePromise,
  SourceValue,
} from './typegenTypeHelpers'
import type { ConditionalKeys, ConditionalPick, ValueOf } from './typeHelpersInternal'

/**
 * Returns a union of all the type names of the members of an abstract type
 *
 * @example
 *   union D = A | B | C
 *   PossibleTypeNames<'D> // 'A' | 'B' | 'C'
 */
export type PossibleTypeNames<AbstractTypeName extends string> = ValueOf<
  ConditionalPick<GetGen<'abstractTypeMembers'>, AbstractTypeName>
>
/**
 * Returns a union of all the members of an abstract type
 *
 * @example
 *   union D = A | B | C
 *   PossibleTypes<'D> // A | B | C
 */
export type PossibleTypes<AbstractTypeName extends string> = SourceValue<PossibleTypeNames<AbstractTypeName>>

/**
 * Returns a union of all the abstract type names where TypeName is used
 *
 * @example
 *   union D = A | B
 *   union E = A
 *   AbstractTypeNames<'A'> // 'D' | 'E'
 */
export type AbstractTypeNames<TypeName extends string> = ConditionalKeys<
  GetGen<'abstractTypeMembers'>,
  TypeName
>

/** Returns whether all the abstract type names where TypeName is used have implemented `resolveType` */
export type IsStrategyResolveTypeImplementedInAllAbstractTypes<TypeName extends string> =
  AbstractTypeNames<TypeName> extends GetGen<'abstractsUsingStrategyResolveType'> ? true : false

/** Returns whether all the members of an abstract type have implemented `isTypeOf` */
export type IsStrategyIsTypeOfImplementedInAllMembers<AbstractTypeName extends string> = GetGen2<
  'abstractTypeMembers',
  AbstractTypeName
> extends GetGen<'objectsUsingAbstractStrategyIsTypeOf'>
  ? true
  : false

export type IsTypeOfHandler<TypeName extends string> = (
  source: PossibleTypes<TypeName>, // typed as never if TypeName is not a member of any abstract type
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<boolean>

/**
 * Get an object with the `isTypeOf` field if applicable for the given object Type.
 *
 * @remarks
 *  Intersect the result of this with other things to build up the final options for a type def.
 */
export type MaybeTypeDefConfigFieldIsTypeOf<TypeName extends string> =
  // is isTypeOf strategy disabled ?
  // then hide isTypeOf property entirely
  IsFeatureEnabled2<'abstractTypeStrategies', 'isTypeOf'> extends false
    ? {}
    : // is TypeName not part of any abstract type?
    // then make isTypeOf optional
    AbstractTypeNames<TypeName> extends never
    ? {
        /**
         * [Abstract Types guide](https://nxs.li/guides/abstract-types)
         *
         * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
         *
         * This type does not show up in any abstract types. Implementing this ***will do nothing*** until you
         * have added it to an abstract type.
         *
         * @example
         *   // Add your type to an abstract
         *   // type like Song in this example
         *
         *   makeSchema({
         *     features: {
         *       abstractTypeStrategies: {
         *         isTypeOf: true,
         *       },
         *     },
         *     types: [
         *       objectType({
         *         name: 'Song',
         *         isTypeOf(data) {
         *           return Boolean(data.album)
         *         },
         *         definition(t) {
         *           t.string('url')
         *           t.string('album')
         *         },
         *       }),
         *       unionType({
         *         name: 'SearchResult',
         *         definition(t) {
         *           t.members('Song') //...
         *         },
         *       }),
         *       queryType({
         *         definition(t) {
         *           t.field('search', {
         *             type: 'SearchResult',
         *             // ...
         *           })
         *         },
         *       }),
         *     ],
         *   })
         *
         * @param source The [source data](https://nxs.li/guides/source-types) for the GraphQL objects that
         *     are members of the abstract types that this type is a member of. For example for some type A
         *     in two union types whose members are A,B.C and A,D,E respectively then isTypeOf method for A
         *     would receive source data from A, B, C, D, & E at runtime.
         * @param context The context data for this request.
         *
         * The context data is typically a singleton scoped to the lifecycle of the request. This means
         *     created at the beginning of a request and then passed to all the resolvers that execute while
         *     resolving the request. It is often used to store information like the current user making the
         *     request. Nexus is not responsible for this however. That is typically something you'll do with
         *     e.g. [Mercurius](https://mercurius.dev) or [Apollo
         *     Server](https://apollographql.com/docs/apollo-server/api/apollo-server).
         *
         * Note that the type here will be whatever you have specified for "contextType" in your makeSchema
         *     configuration.
         * @param info The GraphQL resolve info.
         *
         * This is an advanced parameter seldom used. It includes things like the AST of the [GraphQL
         *     document](https://spec.graphql.org/June2018/#sec-Language.Document) sent by the client.
         * @returns A boolean indicating if the received source data is of this type or not.
         */
        isTypeOf?: IsTypeOfHandler<TypeName>
      }
    : // is resolveType implemented in all abstract types where TypeName is a member?
    // then make isTypeOf optional
    IsStrategyResolveTypeImplementedInAllAbstractTypes<TypeName> extends true
    ? {
        /**
         * [Abstract Types guide](https://nxs.li/guides/abstract-types)
         *
         * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
         *
         * You have implemented the [centralized strategy
         * (resolveType)](https://nxs.li/guides/abstract-types/centralized-strategy) in all abstract types
         * that this type shows up in therefore, implementing this ***will do nothing***.
         *
         * @example
         *   makeSchema({
         *     features: {
         *       abstractTypeStrategies: {
         *         isTypeOf: true,
         *         resolveType: true,
         *       },
         *     },
         *     types: [
         *       objectType({
         *         name: 'Song',
         *         // SearchResult has resolveType
         *         // so this will be ignored!
         *         isTypeOf(data) {
         *           return Boolean(data.album)
         *         },
         *         definition(t) {
         *           t.string('url')
         *           t.string('album')
         *         },
         *       }),
         *       unionType({
         *         name: 'SearchResult',
         *         resolveType() {
         *           if (Boolean(data.album)) {
         *             return 'Song'
         *           }
         *         },
         *         definition(t) {
         *           t.members('Song') //...
         *         },
         *       }),
         *       queryType({
         *         definition(t) {
         *           t.field('search', {
         *             type: 'SearchResult',
         *             // ...
         *           })
         *         },
         *       }),
         *     ],
         *   })
         *
         * @param source The [source data](https://nxs.li/guides/source-types) for the GraphQL objects that
         *     are members of the abstract types that this type is a member of. For example for some type A
         *     in two union types whose members are A,B.C and A,D,E respectively then isTypeOf method for A
         *     would receive source data from A, B, C, D, & E at runtime.
         * @param context The context data for this request.
         *
         * The context data is typically a singleton scoped to the lifecycle of the request. This means
         *     created at the beginning of a request and then passed to all the resolvers that execute while
         *     resolving the request. It is often used to store information like the current user making the
         *     request. Nexus is not responsible for this however. That is typically something you'll do with
         *     e.g. [Mercurius](https://mercurius.dev) or [Apollo
         *     Server](https://apollographql.com/docs/apollo-server/api/apollo-server).
         *
         * Note that the type here will be whatever you have specified for "contextType" in your makeSchema
         *     configuration.
         * @param info The GraphQL resolve info.
         *
         * This is an advanced parameter seldom used. It includes things like the AST of the [GraphQL
         *     document](https://spec.graphql.org/June2018/#sec-Language.Document) sent by the client.
         * @returns A boolean indicating if the received source data is of this type or not.
         */
        isTypeOf?: IsTypeOfHandler<TypeName>
      }
    : // is __typename strategy is enabled?
    // then make isTypeOf optional
    IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true
    ? {
        /**
         * [Abstract Types guide](https://nxs.li/guides/abstract-types)
         *
         * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
         *
         * You have enabled the [Discriminant Model Field (DMF)
         * Strategy](https://nxs.li/guides/abstract-types/discriminant-model-field-strategy) which prevents
         * Nexus from statically knowing if this method is required or not. Therefore it is optional.
         *
         * @example
         *   makeSchema({
         *     features: {
         *       abstractTypeStrategies: {
         *         isTypeOf: true,
         *         __typename: true,
         *       },
         *     },
         *     types: [
         *       objectType({
         *         name: 'Song',
         *         // Only used at runtime if you
         *         // didn't provide __typename below
         *         isTypeOf(data) {
         *           return Boolean(data.album)
         *         },
         *         definition(t) {
         *           t.string('url')
         *           t.string('album')
         *         },
         *       }),
         *       unionType({
         *         name: 'SearchResult',
         *         definition(t) {
         *           t.members('Song') //...
         *         },
         *       }),
         *       queryType({
         *         definition(t) {
         *           t.field('search', {
         *             type: 'SearchResult',
         *             resolve() {
         *               // You _might_ provide typename
         *               // in data returned here
         *               return // ...
         *             },
         *           })
         *         },
         *       }),
         *     ],
         *   })
         *
         * @param source The [source data](https://nxs.li/guides/source-types) for the GraphQL objects that
         *     are members of the abstract types that this type is a member of. For example for some type A
         *     in two union types whose members are A,B.C and A,D,E respectively then isTypeOf method for A
         *     would receive source data from A, B, C, D, & E at runtime.
         * @param context The context data for this request.
         *
         * The context data is typically a singleton scoped to the lifecycle of the request. This means
         *     created at the beginning of a request and then passed to all the resolvers that execute while
         *     resolving the request. It is often used to store information like the current user making the
         *     request. Nexus is not responsible for this however. That is typically something you'll do with
         *     e.g. [Mercurius](https://mercurius.dev) or [Apollo
         *     Server](https://apollographql.com/docs/apollo-server/api/apollo-server).
         *
         * Note that the type here will be whatever you have specified for "contextType" in your makeSchema
         *     configuration.
         * @param info The GraphQL resolve info.
         *
         * This is an advanced parameter seldom used. It includes things like the AST of the [GraphQL
         *     document](https://spec.graphql.org/June2018/#sec-Language.Document) sent by the client.
         * @returns A boolean indicating if the received source data is of this type or not.
         */
        isTypeOf?: IsTypeOfHandler<TypeName>
      }
    : // otherwise, make it required
      {
        /**
         * [Abstract Types guide](https://nxs.li/guides/abstract-types)
         *
         * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
         *
         * You must implement this because your type shows up in one or more abstract types that do not
         * implement the [centralized strategy](https://nxs.li/guides/abstract-types/centralized-strategy).
         *
         * @example
         *   makeSchema({
         *     features: {
         *       abstractTypeStrategies: {
         *         isTypeOf: true,
         *       },
         *     },
         *     types: [
         *       objectType({
         *         name: 'Song',
         *         isTypeOf(data) {
         *           return Boolean(data.album)
         *         },
         *         definition(t) {
         *           t.string('url')
         *           t.string('album')
         *         },
         *       }),
         *       unionType({
         *         name: 'SearchResult',
         *         definition(t) {
         *           t.members('Song') //...
         *         },
         *       }),
         *       queryType({
         *         definition(t) {
         *           t.field('search', {
         *             type: 'SearchResult',
         *             // ...
         *           })
         *         },
         *       }),
         *     ],
         *   })
         *
         * @param source The [source data](https://nxs.li/guides/source-types) for the GraphQL objects that
         *     are members of the abstract types that this type is a member of. For example for some type A
         *     in two union types whose members are A,B.C and A,D,E respectively then isTypeOf method for A
         *     would receive source data from A, B, C, D, & E at runtime.
         * @param context The context data for this request.
         *
         * The context data is typically a singleton scoped to the lifecycle of the request. This means
         *     created at the beginning of a request and then passed to all the resolvers that execute while
         *     resolving the request. It is often used to store information like the current user making the
         *     request. Nexus is not responsible for this however. That is typically something you'll do with
         *     e.g. [Mercurius](https://mercurius.dev) or [Apollo
         *     Server](https://apollographql.com/docs/apollo-server/api/apollo-server).
         *
         * Note that the type here will be whatever you have specified for "contextType" in your makeSchema
         *     configuration.
         * @param info The GraphQL resolve info.
         *
         * This is an advanced parameter seldom used. It includes things like the AST of the [GraphQL
         *     document](https://spec.graphql.org/June2018/#sec-Language.Document) sent by the client.
         * @returns A boolean indicating if the received source data is of this type or not.
         */
        isTypeOf: IsTypeOfHandler<TypeName>
      }

/**
 * Get an object with the `resolveType` field if applicable for the given abstract Type.
 *
 * @remarks
 *  Intersect the result of this with other things to build up the final options for a type def.
 */
export type MaybeTypeDefConfigFieldResolveType<TypeName extends string> = IsFeatureEnabled2<
  'abstractTypeStrategies',
  'resolveType'
> extends false
  ? {} // remove field altogether is resolveType strategy is disabled
  : IsStrategyIsTypeOfImplementedInAllMembers<TypeName> extends true
  ? {
      /**
       * [Abstract Types Guide](https://nxs.li/guides/abstract-types)
       *
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will first look for __typename, then fallback to calling `isTypeOf` on each
       * implementing Object type.
       */
      resolveType?: Maybe<AbstractTypeResolver<TypeName>>
    } // Make resolveType optional when __typename strategy is enabled
  : IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true
  ? {
      /**
       * [Abstract Types Guide](https://nxs.li/guides/abstract-types)
       *
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will first look for __typename, then fallback to calling `isTypeOf` on each
       * implementing Object type.
       */
      resolveType?: Maybe<AbstractTypeResolver<TypeName>>
    }
  : {
      /**
       * [Abstract Types Guide](https://nxs.li/guides/abstract-types)
       *
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will first look for __typename, then fallback to calling `isTypeOf` on each
       * implementing Object type.
       */
      resolveType: AbstractTypeResolver<TypeName>
    }
