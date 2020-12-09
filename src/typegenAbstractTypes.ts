import { GraphQLResolveInfo } from 'graphql'
import {
  AbstractTypeResolver,
  GetGen,
  GetGen2,
  IsFeatureEnabled2,
  MaybePromise,
  SourceValue,
} from './typegenTypeHelpers'
import { ConditionalKeys, ConditionalPick, ValueOf } from './typeHelpersInternal'

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
export type IsStrategyResolveTypeImplementedInAllAbstractTypes<
  TypeName extends string
> = AbstractTypeNames<TypeName> extends GetGen<'abstractsUsingStrategyResolveType'> ? true : false

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
// prettier-ignore
export type MaybeTypeDefConfigFieldIsTypeOf<TypeName extends string> =
  // is isTypeOf strategy disabled ?
  IsFeatureEnabled2<'abstractTypeStrategies', 'isTypeOf'> extends false
  // then hide isTypeOf property entirely
  ? {}
  // is TypeName not part of any abstract type?
  : AbstractTypeNames<TypeName> extends never
  // then make isTypeOf optional
  ? {
      /** C */
      isTypeOf?: IsTypeOfHandler<TypeName>
    }
  // is resolveType implemented in all abstract types where TypeName is a member?
  : IsStrategyResolveTypeImplementedInAllAbstractTypes<TypeName> extends true
  // then make isTypeOf optional
  ? {
      /**
       * [Abstract Types guide](https://nxs.li/guides/abstract-types)
       *
       * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
       *
       * Either you have implemented the [centralized strategy
       * (resolveType)](https://nxs.li/guides/abstract-types/centralized-strategy) in all abstract
       * types that this type shows up in or this type does not show up in any abstract types. Either
       * way, and therefore, implementing this ***will do nothing***.
       * 
       */
      isTypeOf?: IsTypeOfHandler<TypeName>
    }
  // is __typename strategy is enabled?
  : IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true
  // then make isTypeOf optional
  ? {
      /** B */
      isTypeOf?: IsTypeOfHandler<TypeName>
    }
  // otherwise, make it required
  : {
      /**
       * [Abstract Types guide](https://nxs.li/guides/abstract-types)
       *
       * Implement the [modular strategy](https://nxs.li/guides/abstract-types/modular-strategy).
       *
       * You must implement this because your type shows up in one or more abstract types that do
       * not implement the [centralized strategy](https://nxs.li/guides/abstract-types/centralized-strategy).
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
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will call `isTypeOf` on each implementing Object type.
       */
      resolveType?: AbstractTypeResolver<TypeName>
    } // Make resolveType optional when __typename strategy is enabled
  : IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true
  ? {
      /**
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will call `isTypeOf` on each implementing Object type.
       */
      resolveType?: AbstractTypeResolver<TypeName>
    }
  : {
      /**
       * Optionally provide a custom type resolver function. If one is not provided, the default
       * implementation will call `isTypeOf` on each implementing Object type.
       */
      resolveType: AbstractTypeResolver<TypeName>
    }
