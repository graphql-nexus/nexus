import { GraphQLResolveInfo } from 'graphql'
import {
  AbstractTypeResolver,
  GetGen,
  GetGen2,
  IsFeatureEnabled2,
  MaybePromise,
  RootValue,
} from './typegenTypeHelpers'
import { ConditionalKeys, ConditionalPick, ValueOf } from './typeHelpersInternal'

/**
 * Returns a union of all the type names of the members of an abstract type
 *
 * @example
 *
 * union D = A | B | C
 * PossibleTypeNames<'D> // 'A' | 'B' | 'C'
 */
export type PossibleTypeNames<AbstractTypeName extends string> = ValueOf<
  ConditionalPick<GetGen<'abstractTypeMembers'>, AbstractTypeName>
>
/**
 * Returns a union of all the members of an abstract type
 *
 * @example
 * union D = A | B | C
 * PossibleTypes<'D> // A | B | C
 */
export type PossibleTypes<AbstractTypeName extends string> = RootValue<PossibleTypeNames<AbstractTypeName>>

/**
 * Returns a union of all the abstract type names where TypeName is used
 *
 * @example
 * union D = A | B
 * union E = A
 * AbstractTypeNames<'A'> // 'D' | 'E'
 */
export type AbstractTypeNames<TypeName extends string> = ConditionalKeys<
  GetGen<'abstractTypeMembers'>,
  TypeName
>

/**
 * Returns whether all the abstract type names where TypeName is used have implemented `resolveType`
 */
export type IsStrategyResolveTypeImplementedInAllAbstractTypes<TypeName extends string> = AbstractTypeNames<
  TypeName
> extends GetGen<'abstractsUsingStrategyResolveType'>
  ? true
  : false

/**
 * Returns whether all the members of an abstract type have implemented `isTypeOf`
 */
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
 *
 * Intersect the result of this with other things to build up the final options for a type def.
 */
// prettier-ignore
export type MaybeTypeDefConfigFieldIsTypeOf<TypeName extends string> =
IsFeatureEnabled2<'abstractTypeStrategies', 'isTypeOf'> extends false // is isTypeOf strategy disabled ?
? {} // then hide isTypeOf property entirely
: IsStrategyResolveTypeImplementedInAllAbstractTypes<TypeName> extends true // is resolveType implemented in all abstract types where TypeName is a member?
  ? { isTypeOf?: IsTypeOfHandler<TypeName> } // then make isTypeOf optional
  : IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true // is __typename strategy is enabled?
    ? { isTypeOf?: IsTypeOfHandler<TypeName> } // then make isTypeOf optional
    : AbstractTypeNames<TypeName> extends never  // is TypeName not part of any abstract type?
    ? { isTypeOf?: IsTypeOfHandler<TypeName> } // then make isTypeOf optional
    : { isTypeOf: IsTypeOfHandler<TypeName> } // otherwise, make it required

/**
 * Get an object with the `resolveType` field if applicable for the given abstract Type.
 *
 * @remarks
 *
 * Intersect the result of this with other things to build up the final options for a type def.
 */
export type MaybeTypeDefConfigFieldResolveType<TypeName extends string> = IsFeatureEnabled2<
  'abstractTypeStrategies',
  'resolveType'
> extends false
  ? {} // remove field altogether is resolveType strategy is disabled
  : IsStrategyIsTypeOfImplementedInAllMembers<TypeName> extends true
  ? {
      /**
       * Optionally provide a custom type resolver function. If one is not provided,
       * the default implementation will call `isTypeOf` on each implementing
       * Object type.
       */
      resolveType?: AbstractTypeResolver<TypeName>
    } // Make resolveType optional when __typename strategy is enabled
  : IsFeatureEnabled2<'abstractTypeStrategies', '__typename'> extends true
  ? {
      /**
       * Optionally provide a custom type resolver function. If one is not provided,
       * the default implementation will call `isTypeOf` on each implementing
       * Object type.
       */
      resolveType?: AbstractTypeResolver<TypeName>
    }
  : {
      /**
       * Optionally provide a custom type resolver function. If one is not provided,
       * the default implementation will call `isTypeOf` on each implementing
       * Object type.
       */
      resolveType: AbstractTypeResolver<TypeName>
    }
