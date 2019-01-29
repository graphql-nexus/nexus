import { GraphQLResolveInfo } from "graphql";
import { ArgDef } from "./definitions/args";

declare global {
  interface NexusGen {}
}

export type MaybePromise<T> = PromiseLike<T> | T;

/**
 *
 */
export type MaybePromiseDeep<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<MaybePromiseDeep<U>>
    : T[P] extends ReadonlyArray<infer Y>
    ? ReadonlyArray<MaybePromiseDeep<Y>>
    : MaybePromiseDeep<T[P]>
};

export type OutputFieldArgs = Record<string, ArgDef>;

// export type FieldType<
//   TypeName extends string,
//   FieldName extends string,
//   GenTypes = NexusGen
// > = GetGen3<GenTypes, "">;

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
export interface AbstractTypeResolver<
  TypeName extends string,
  GenTypes = NexusGen
> {
  (
    source: RootValue<TypeName, GenTypes>,
    context: GetGen<GenTypes, "context">,
    info: GraphQLResolveInfo
  ): MaybePromise<AbstractResolveReturn<TypeName, GenTypes>>;
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
export type FieldResolver<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<GenTypes, "context">,
  info: GraphQLResolveInfo
) => MaybePromiseDeep<ResultValue<GenTypes, TypeName, FieldName>>;

export type AbstractResolveReturn<
  TypeName extends string,
  GenTypes = NexusGen
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["abstractResolveReturn"]
    ? GenTypes["abstractResolveReturn"][TypeName]
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
  GenTypes,
  K extends GenTypesShapeKeys
> = GenTypes extends GenTypesShape ? GenTypes[K] : any;

export type GetGen2<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>
> = GenTypes extends GenTypesShape
  ? K extends keyof GenTypes
    ? K2 extends keyof GenTypes[K]
      ? GenTypes[K][K2]
      : any
    : any
  : any;

export type GetGen3<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>
> = GenTypes extends GenTypesShape
  ? K extends keyof GenTypes
    ? K2 extends keyof GenTypes[K]
      ? K3 extends keyof GenTypes[K][K2]
        ? GenTypes[K][K2][K3]
        : any
      : any
    : any
  : any;

export type HasGen<
  GenTypes,
  K extends GenTypesShapeKeys
> = GenTypes extends GenTypesShape
  ? K extends keyof GenTypes
    ? true
    : false
  : false;

export type HasGen2<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>
> = GenTypes extends GenTypesShape
  ? K extends keyof GenTypes
    ? K2 extends keyof GenTypes[K]
      ? true
      : false
    : false
  : false;

export type HasGen3<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>
> = GenTypes extends GenTypesShape
  ? K extends keyof GenTypes
    ? K2 extends keyof GenTypes[K]
      ? K3 extends keyof GenTypes[K][K2]
        ? true
        : false
      : false
    : false
  : false;

export type RootValue<TypeName extends string, GenTypes = NexusGen> = GetGen2<
  GenTypes,
  "rootTypes",
  TypeName
>;

export type RootValueField<
  GenTypes,
  TypeName extends string,
  FieldName extends string
> = GetGen3<GenTypes, "rootTypes", TypeName, FieldName>;

export type ArgsValue<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = GetGen3<GenTypes, "argTypes", TypeName, FieldName>;

export type ResultValue<
  GenTypes,
  TypeName extends string,
  FieldName extends string
> = GetGen3<GenTypes, "fieldTypes", TypeName, FieldName>;

export type NeedsResolver<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = HasGen3<GenTypes, "fieldTypes", TypeName, FieldName> extends true
  ? GetGen3<GenTypes, "fieldTypes", TypeName, FieldName> extends null
    ? false
    : HasGen3<GenTypes, "rootTypes", TypeName, FieldName> extends true
    ? GetGen3<GenTypes, "rootTypes", TypeName, FieldName> extends null
      ? true
      : false
    : true
  : false;
