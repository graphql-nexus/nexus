import { GraphQLResolveInfo } from "graphql";

declare global {
  interface NexusGen {}
  interface NexusGenCustomDefinitionMethods<TypeName extends string> {}
}

export type AllInputTypes = GetGen<"allInputTypes">;

export type AllOutputTypes = GetGen<"allOutputTypes">;

export type FieldType<
  TypeName extends string,
  FieldName extends string
> = GetGen3<"fieldTypes", TypeName, FieldName>;

export type MaybePromise<T> = PromiseLike<T> | T;

/**
 * Because the GraphQL field execution algorithm automatically
 * resolves promises at any level of the tree, we use this
 * to help signify that.
 */
export type MaybePromiseDeep<T> = Date extends T
  ? MaybePromise<T>
  : boolean extends T
  ? MaybePromise<T>
  : number extends T
  ? MaybePromise<T>
  : object extends T
  ? MaybePromise<
      | T
      | {
          [P in keyof T]: T[P] extends Array<infer U>
            ? Array<MaybePromiseDeep<U>>
            : T[P] extends ReadonlyArray<infer Y>
            ? ReadonlyArray<MaybePromiseDeep<Y>>
            : MaybePromiseDeep<T[P]>
        }
    >
  : MaybePromise<T>;

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
    context: GetGen<"context">,
    info: GraphQLResolveInfo
  ): MaybePromise<AbstractResolveReturn<TypeName> | null>;
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
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromiseDeep<ResultValue<TypeName, FieldName>>;

export type AuthorizeResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<boolean | Error>;

export type AbstractResolveReturn<
  TypeName extends string
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? TypeName extends keyof GenTypes["abstractResolveReturn"]
      ? GenTypes["abstractResolveReturn"][TypeName]
      : any
    : any
  : any;

/**
 * Generated type helpers:
 */
export type GenTypesShapeKeys =
  | "context"
  | "inputTypes"
  | "rootTypes"
  | "argTypes"
  | "fieldTypes"
  | "allTypes"
  | "inheritedFields"
  | "objectNames"
  | "inputNames"
  | "enumNames"
  | "interfaceNames"
  | "scalarNames"
  | "unionNames"
  | "allInputTypes"
  | "allOutputTypes"
  | "allNamedTypes"
  | "abstractTypes"
  | "abstractResolveReturn";

/**
 * Helpers for handling the generated schema
 */
export type GenTypesShape = Record<GenTypesShapeKeys, any>;

export type GetGen<
  K extends GenTypesShapeKeys,
  Fallback = any
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? GenTypes[K]
    : Fallback
  : Fallback;

export type GetGen2<
  K extends GenTypesShapeKeys,
  K2 extends keyof GenTypesShape[K]
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? K2 extends keyof GenTypes[K]
        ? GenTypes[K][K2]
        : any
      : any
    : any
  : any;

export type GetGen3<
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? K2 extends keyof GenTypes[K]
        ? K3 extends keyof GenTypes[K][K2]
          ? GenTypes[K][K2][K3]
          : any
        : any
      : any
    : any
  : any;

export type HasGen<
  K extends GenTypesShapeKeys
> = NexusGen extends infer GenTypes
  ? GenTypes extends GenTypesShape
    ? K extends keyof GenTypes
      ? true
      : false
    : false
  : false;

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
  : false;

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
  : false;

export type RootValue<TypeName extends string> = GetGen2<"rootTypes", TypeName>;

export type RootValueField<
  TypeName extends string,
  FieldName extends string
> = GetGen3<"rootTypes", TypeName, FieldName>;

export type ArgsValue<
  TypeName extends string,
  FieldName extends string
> = GetGen3<"argTypes", TypeName, FieldName>;

export type ResultValue<
  TypeName extends string,
  FieldName extends string
> = GetGen3<"fieldTypes", TypeName, FieldName>;

export type NeedsResolver<
  TypeName extends string,
  FieldName extends string
> = HasGen3<"fieldTypes", TypeName, FieldName> extends true
  ? null extends GetGen3<"fieldTypes", TypeName, FieldName>
    ? false
    : HasGen3<"rootTypes", TypeName, FieldName> extends true
    ? null extends GetGen3<"rootTypes", TypeName, FieldName>
      ? true
      : false
    : true
  : HasGen3<"rootTypes", TypeName, FieldName> extends true
  ? null extends GetGen3<"rootTypes", TypeName, FieldName>
    ? true
    : false
  : false;
