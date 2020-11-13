import { GraphQLResolveInfo } from 'graphql'

declare global {
  interface NexusGen {}
  interface NexusGenCustomInputMethods<TypeName extends string> {}
  interface NexusGenCustomOutputMethods<TypeName extends string> {}
  interface NexusGenCustomOutputProperties<TypeName extends string> {}
  interface NexusGenPluginSchemaConfig {}
  interface NexusGenPluginTypeConfig<TypeName extends string> {}
  interface NexusGenPluginFieldConfig<TypeName extends string, FieldName extends string> {}
}

export type AllInputTypes = GetGen<'allInputTypes', string>

export type AllOutputTypes = GetGen<'allOutputTypes', string>

/**
 * This type captures all output types defined in the app
 * as well as core GraphQL spec objects.
 */
export type AllOutputTypesPossible = AllOutputTypes | 'Query' | 'Mutation' | 'Subscription'

export type FieldType<TypeName extends string, FieldName extends string> = GetGen3<
  'fieldTypes',
  TypeName,
  FieldName
>

export type MaybePromise<T> = PromiseLike<T> | T

/**
 * Because the GraphQL field execution algorithm automatically
 * resolves promises at any level of the tree, we use this
 * to help signify that.
 */
export type MaybePromiseDeep<T> = Date extends T
  ? MaybePromise<T>
  : null extends T
  ? MaybePromise<T>
  : boolean extends T
  ? MaybePromise<T>
  : number extends T
  ? MaybePromise<T>
  : string extends T
  ? MaybePromise<T>
  : T extends Array<infer U>
  ? MaybePromise<Array<MaybePromiseDeep<U>>>
  : T extends ReadonlyArray<infer Y>
  ? MaybePromise<ReadonlyArray<MaybePromiseDeep<Y>>>
  : T extends object
  ? MaybePromise<
      | T
      | {
          [P in keyof T]: MaybePromiseDeep<T[P]>
        }
    >
  : MaybePromise<T>

/**
 * The NexusAbstractTypeResolver type can be used if you want to preserve type-safety
 * and autocomplete on an abstract type resolver (interface or union) outside of the Nexus
 * configuration
 *
 * @example
 * ```
 * const mediaType: AbstractTypeResolver<'MediaType'> = (root, ctx, info) => {
 *   if (ctx.user.isLoggedIn()) {
 *     return ctx.user.getItems()
 *   }
 *   return null
 * }
 * ```
 */
export interface AbstractTypeResolver<TypeName extends string> {
  (
    source: RootValue<TypeName>,
    context: GetGen<'context'>,
    info: GraphQLResolveInfo
  ): MaybePromise<AbstractResolveReturn<TypeName> | null>
}

/**
 * The FieldResolver type can be used when you want to preserve type-safety
 * and autocomplete on a resolver outside of the Nexus definition block
 *
 * @example
 * ```
 * const userItems: FieldResolver<'User', 'items'> = (root, args, ctx, info) => {
 *   if (ctx.user.isLoggedIn()) {
 *     return ctx.user.getItems()
 *   }
 *   return null
 * }
 * ```
 */
export type FieldResolver<TypeName extends string, FieldName extends string> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<TypeName, FieldName>> | MaybePromiseDeep<ResultValue<TypeName, FieldName>>

export type FieldTypeName<TypeName extends string, FieldName extends string> = GetGen3<
  'fieldTypeNames',
  TypeName,
  FieldName
>

export type SubFieldResolver<
  TypeName extends string,
  FieldName extends string,
  SubFieldName extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) =>
  | MaybePromise<ResultValue<TypeName, FieldName>[SubFieldName]>
  | MaybePromiseDeep<ResultValue<TypeName, FieldName>[SubFieldName]>

export type AbstractResolveReturn<TypeName extends string> = GetGen2<'abstractTypeMembers', TypeName, any>

/**
 * Generated type helpers:
 */
export type GenTypesShapeKeys =
  | 'context'
  | 'inputTypes'
  | 'rootTypes'
  | 'argTypes'
  | 'fieldTypes'
  | 'fieldTypeNames'
  | 'allTypes'
  | 'inheritedFields'
  | 'objectNames'
  | 'inputNames'
  | 'enumNames'
  | 'interfaceNames'
  | 'scalarNames'
  | 'unionNames'
  | 'allInputTypes'
  | 'allOutputTypes'
  | 'allNamedTypes'
  | 'abstractTypes'
  | 'abstractTypeMembers'
  | 'objectsUsingAbstractStrategyIsTypeOf'
  | 'abstractsUsingStrategyResolveType'
  | 'features'

/**
 * Helpers for handling the generated schema
 */
export type GenTypesShape = Record<GenTypesShapeKeys, any>

export type GetGen<K extends GenTypesShapeKeys, Fallback = any> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? GenTypes[K]
    : Fallback
  : Fallback

export type GetGen2<
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  Fallback = any
> = K2 extends keyof GetGen<K, never> ? GetGen<K>[K2] : Fallback

export type GetGen3<
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>,
  Fallback = any
> = K2 extends keyof GetGen<K, never>
  ? K3 extends keyof GetGen<K>[K2]
    ? GetGen<K>[K2][K3]
    : Fallback
  : Fallback

export type HasGen<K extends GenTypesShapeKeys> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? true
      : false
    : false
  : false

export type HasGen2<
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? K2 extends keyof GenTypes[K]
        ? true
        : false
      : false
    : false
  : false

export type HasGen3<
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? K2 extends keyof GenTypes[K]
        ? K3 extends keyof GenTypes[K][K2]
          ? true
          : false
        : false
      : false
    : false
  : false

export type RootValue<TypeName extends string> = GetGen2<'rootTypes', TypeName>

export type RootValueField<TypeName extends string, FieldName extends string> = GetGen3<
  'rootTypes',
  TypeName,
  FieldName
>

export type ArgsValue<TypeName extends string, FieldName extends string> = HasGen3<
  'fieldTypes',
  TypeName,
  FieldName
> extends true
  ? GetGen3<'argTypes', TypeName, FieldName, {}>
  : any

export type ResultValue<TypeName extends string, FieldName extends string> = GetGen3<
  'fieldTypes',
  TypeName,
  FieldName
>

export type NeedsResolver<TypeName extends string, FieldName extends string> = HasGen3<
  'fieldTypes',
  TypeName,
  FieldName
> extends true
  ? null extends GetGen3<'fieldTypes', TypeName, FieldName>
    ? false
    : HasGen3<'rootTypes', TypeName, FieldName> extends true
    ? null extends GetGen3<'rootTypes', TypeName, FieldName>
      ? true
      : false
    : true
  : HasGen3<'rootTypes', TypeName, FieldName> extends true
  ? null extends GetGen3<'rootTypes', TypeName, FieldName>
    ? true
    : false
  : false

/**
 * Borrowed from `type-fest`
 * Extract the keys from a type where the value type of the key extends the given `Condition`.
 */
type ConditionalKeys<Base, Condition> = NonNullable<
  // Wrap in `NonNullable` to strip away the `undefined` type from the produced union.
  {
    // Map through all the keys of the given base type.
    [Key in keyof Base]: Condition extends Base[Key] // Pick only keys with types extending the given `Condition` type.
      ? Key // Retain this key since the condition passes.
      : never // Discard this key since the condition fails.

    // Convert the produced object into a union type of the keys which passed the conditional test.
  }[keyof Base]
>

/**
 * Taken from `type-fest`
 * Pick keys from the shape that matches the given `Condition`.
 */
export type ConditionalPick<Base, Condition> = Pick<Base, ConditionalKeys<Base, Condition>>

/**
 * Taken from `type-fest`
 * Get the values of a mapped types
 */
export type ValueOf<ObjectType, ValueType extends keyof ObjectType = keyof ObjectType> = ObjectType[ValueType]

export type IsFeatureEnabled2<PathPart1 extends string, PathPart2 extends string> = GetGen3<
  'features',
  PathPart1,
  PathPart2,
  false
> extends true
  ? true
  : false

export type Discriminate<
  TypeName extends string,
  Required extends 'required' | 'optional',
  Type = RootValue<TypeName>
> = Type extends { __typename: TypeName }
  ? Type
  : Type extends { __typename?: TypeName }
  ? Type
  : Required extends 'required'
  ? Type & { __typename: TypeName }
  : Type & { __typename?: TypeName }

export namespace AbstractTypes {
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
}
