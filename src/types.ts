import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
  GraphQLResolveInfo,
  GraphQLSchema,
  GraphQLScalarType,
} from "graphql";
import {
  ObjectTypeDef,
  InputObjectTypeDef,
  InterfaceTypeDef,
  EnumTypeDef,
  UnionTypeDef,
  ExtendTypeDef,
  WrappedType,
} from "./core";
import { Metadata } from "./metadata";

export type WrappedOutput =
  | WrappedType<NamedOutputTypeDef>
  | WrappedType<GraphQLScalarType>;

export type Wrappable =
  | NamedTypeDef
  | ExtendTypeDef<any, any>
  | GraphQLScalarType;

export type NamedOutputTypeDef<GenTypes = any> =
  | ObjectTypeDef<GenTypes, any>
  | InterfaceTypeDef<GenTypes, any>
  | EnumTypeDef<GenTypes>
  | UnionTypeDef<GenTypes>;

export type NamedTypeDef<GenTypes = any> =
  | InputObjectTypeDef<GenTypes, any>
  | NamedOutputTypeDef<GenTypes>;

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type BaseScalars = "String" | "Int" | "Float" | "ID" | "Boolean";

export type MaybePromise<T> = Promise<T> | T;

export type MaybeThunk<T> = T | (() => T);

export type Maybe<T> = T | null;

export type MixDef = {
  typeName: string;
  options: MixOpts<any>;
};

export type FieldDef = InputFieldConfig | OutputFieldConfig;

export interface OutputFieldConfig extends OutputFieldOpts {
  name: string;
  type: any;
}

export interface InputFieldConfig extends InputFieldOpts {
  name: string;
  type: any;
}

export interface EnumMemberInfo {
  name: string;
  value: any;
  description?: string;
}

export interface EnumMemberConfig {
  value?: any;
  description?: string;
}

export interface BuildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType>
> {
  typeMap: TypeMapDefs;
  metadata: Metadata;
}

/**
 * The MixOmitOpts is used when mixing union types, as there is no
 * benefit to "pick" union members vs. defining them manually.
 */
export interface MixOmitOpts<TMembers> {
  omit?: Array<TMembers>;
}

/**
 * When you're mixing types/partials, you can pick or omit
 * fields from the types you're mixing in.
 */
export interface MixOpts<TMembers> {
  pick?: Array<TMembers>;
  omit?: Array<TMembers>;
}

export interface DeprecationInfo {
  /**
   * Date | YYYY-MM-DD formatted date of when this field
   * became deprecated.
   */
  startDate?: string | Date;
  /**
   * Reason for the deprecation.
   */
  reason: string;
  /**
   * Field or usage that replaces the deprecated field.
   */
  supersededBy?: string;
}

export interface CommonOpts {
  /**
   * The description of the field, as defined in the GraphQL object definition
   */
  description?: string;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string | DeprecationInfo;
}

export interface DirectiveOption {
  name: string;
  args: Record<string, any>;
}

export interface OutputOpts extends CommonOpts {
  /**
   * Whether the field can be returned or input as null
   * @default false
   */
  nullable?: boolean;
  /**
   * Whether the field returns a list of values, or just a single value.
   * If list is true, we assume the field is a list. If list is an array,
   * we'll assume that it's a list with the depth. The boolean indicates whether
   * the field is required (non-null).
   *
   * @see TODO: Examples
   */
  list?: true | boolean[];
}

export interface ArgOpts extends CommonOpts {
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Whether the arguments are a list or not
   */
  list: true | boolean[];
}

export interface ArgDefinition
  extends Readonly<
    ArgOpts & {
      type: any;
    }
  > {} // TODO: Make type safe

export interface DirectiveArgDefinition extends ArgDefinition {
  readonly name: string;
}

export type OutputFieldArgs = Record<string, ArgDefinition>;

/**
 * All non-resolver output field options
 */
export interface CommonOutputOpts {
  /**
   * Any arguments defined
   */
  args?: OutputFieldArgs;
}

export interface OutputFieldOpts<
  GenTypes = any,
  TypeName = any,
  FieldName = any,
  ResolveFallback = any
> extends CommonOutputOpts {
  /**
   * Resolver for the output field
   */
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>;

  /**
   * Default value for the field, if none is returned.
   */
  default?: MaybeThunk<
    ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>
  >;

  // /**
  //  * Subscription for the output field.
  //  */
  // subscribe?: OutputFieldResolver<GenTypes, TypeName, FieldName>
}

export type OutputFieldResolver<
  GenTypes,
  TypeName extends string,
  FieldName extends string,
  ResolveFallback
> = (
  root: GetGen2<GenTypes, "rootTypes", TypeName>,
  args: GetGen3<GenTypes, "argTypes", TypeName, FieldName>,
  context: GetGen<GenTypes, "context">,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>>;

/**
 * All properties that can be changed about a field
 */
export type ModifyFieldOpts<GenTypes, TypeName, FieldName, ResolveFallback> = {
  /**
   * The description of the field, as defined in the GraphQL object definition.
   */
  description?: string;
  /**
   * Resolver for the output field
   */
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>;
  /**
   * Default value for the field, if none is returned.
   */
  default?: MaybeThunk<
    ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>
  >;
};

export interface InputFieldOpts<GenTypes = any, TypeName = any> {
  /**
   * Setting this to true is the same as setting `nullable: false`
   */
  required?: boolean;
  /**
   * Whether the item in the list is required
   */
  requiredListItem?: boolean;
  /**
   * Set a default value for the input type
   */
  default?: InputValue<GenTypes, TypeName>;
}

export interface ScalarOpts
  extends Pick<
    GraphQLScalarTypeConfig<any, any>,
    "description" | "serialize" | "parseValue" | "parseLiteral"
  > {
  /**
   * Backing type for the scalar
   */
  typing?: string | ImportedType;
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: string | DeprecationInfo;
}

interface HasMixins {
  mixed: MixDef[];
}

interface HasFields {
  fields: FieldDef[];
}

interface HasInterfaces {
  interfaces: string[];
}

interface Named {
  name: string;
}

interface SharedTypeConfig {
  /**
   * Description for a GraphQL type
   */
  description?: string;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string | DeprecationInfo;
}

interface DefaultResolver {
  /**
   * Default field resolver for all members of this type
   */
  defaultResolver?: GraphQLFieldResolver<any, any>;
}

export interface Nullability {
  /**
   * Configures the nullability defaults at the type-level
   */
  nullability?: NullabilityConfig;
}

export interface EnumTypeConfig extends Named, HasMixins, SharedTypeConfig {
  members: EnumMemberInfo[];
}

export interface UnionTypeConfig extends Named, HasMixins, SharedTypeConfig {
  members: string[];
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: TypeResolver<any, any>;
}

export interface OutputObjectConfig extends Named, HasFields {}

export interface InputTypeConfig
  extends Named,
    HasFields,
    HasMixins,
    SharedTypeConfig,
    Nullability {}

export interface ObjectTypeConfig
  extends Named,
    HasFields,
    HasMixins,
    HasInterfaces,
    SharedTypeConfig,
    Nullability,
    DefaultResolver {
  /**
   * Any modifications to the field config
   */
  fieldModifications: Record<string, ModifyFieldOpts<any, any, any, any>>;
}

export interface ExtendTypeConfig extends Named, HasFields, HasInterfaces {}

export interface InterfaceTypeConfig
  extends Named,
    HasFields,
    HasMixins,
    SharedTypeConfig,
    Nullability,
    DefaultResolver {
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: TypeResolver<any, any>;
}

export interface ImportedType {
  /**
   * The name of the imported type. If the type is a
   * default export, this should be "default".
   */
  name: string;
  /**
   * The absolute path to import from
   * if omitted it's assumed you already
   * imported the type, or it's a global.
   */
  importPath: string;
}

export interface BuilderConfig<GenTypes = NexusGen> extends Nullability {
  /**
   * When the schema starts and `process.env.NODE_ENV !== "production"`,
   * artifact files are auto-generated containing the .graphql definitions of
   * the schema
   */
  outputs:
    | {
        /**
         * Absolute path where the GraphQL IDL file should be written
         */
        schema: string | false;
        /**
         * File path where generated types should be saved
         */
        typegen: string | false;
      }
    | false;
  /**
   * Whether the schema & types are generated when the server
   * starts. Default is process.env.NODE_ENV !== "production"
   */
  shouldGenerateArtifacts?: boolean;
  /**
   * Automatically configure type resolution for the TypeScript
   * representations of the associated types.
   *
   * Alias for typegenConfig: typegenAutoConfig(options)
   */
  typegenAutoConfig?: TypegenAutoConfigOptions;
  /**
   * A configuration function for advanced cases where
   * more control over the `TypegenInfo` is needed.
   */
  typegenConfig?: (
    schema: GraphQLSchema,
    outputPath: string
  ) => TypegenInfo<GenTypes> | PromiseLike<TypegenInfo<GenTypes>>;
  /**
   * Either an absolute path to a .prettierrc file, or an object
   * with relevant Prettier rules to be used on the generated output
   */
  prettierConfig?: string | object;
  /**
   * Manually apply a formatter to the generated content before saving,
   * see the `prettierConfig` option if you want to use Prettier.
   */
  formatTypegen?: FormatTypegenFn;
}

export type FormatTypegenFn = (
  content: string,
  type: "types" | "schema"
) => MaybePromise<string>;

export interface SchemaConfig extends BuilderConfig {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
}

export interface TypegenInfo<GenTypes> {
  /**
   * Headers attached to the generate type output
   */
  headers: string[];
  /**
   * All imports for the backing types / context
   */
  imports: string[];
  /**
   * A map of all GraphQL types and what TypeScript types they should
   * be represented by.
   */
  backingTypeMap: { [K in GetGen<GenTypes, "objectNames">]?: string };
  /**
   * The type of the context for the resolvers
   */
  contextType?: string;
}

export interface NullabilityConfig {
  /**
   * Whether output fields can return null by default.
   *
   * type Example {
   *   field: String!
   *   otherField: [String!]!
   * }
   *
   * @default false
   */
  output?: boolean;
  /**
   * Whether input fields (field arguments, input type members)
   * are nullable by default.
   *
   * input Example {
   *   field: String
   *   something: [String]
   * }
   *
   * @default true
   */
  input?: boolean;
}

export interface TypegenConfigSourceModule {
  /**
   * The module for where to look for the types.
   * This uses the node resolution algorthm via require.resolve,
   * so if this lives in node_modules, you can just provide the module name
   * otherwise you should provide the absolute path to the file.
   */
  module: string;
  /**
   * When we import the module, we use `import * as ____` to prevent
   * conflicts. This alias should be a name that doesn't conflict with any other
   * types, usually a short lowercase name.
   */
  alias: string;
  /**
   * Provides a custom approach to matching for the type
   *
   * If not provided, the default implementation is:
   * ```
   * (type) => new RegExp('(?:interface|type|class)\s+(${type.name})\W')
   * ```
   */
  typeMatch?: (
    type: GraphQLNamedType,
    defaultRegex: RegExp
  ) => RegExp | RegExp[];
  /**
   * A list of typesNames or regular expressions matching type names
   * that should be resolved by this import. Provide an empty array if you
   * wish to use the file for context and ensure no other types are matched.
   */
  onlyTypes?: (string | RegExp)[];
  /**
   * By default the import is configured `import * as alias from`, setting glob to false
   * will change this to `import alias from`
   */
  glob?: false;
}

export interface TypegenAutoConfigOptions {
  /**
   * Any headers to prefix on the generated type file
   */
  headers?: string[];
  /**
   * Array of files to match for a type
   *
   * ```
   * sources: [
   *   { module: 'typescript', alias: 'ts' },
   *   { module: path.join(__dirname, '../backingTypes'), alias: 'b' },
   * ]
   * ```
   */
  sources: TypegenConfigSourceModule[];
  /**
   * Typing for the context, referencing a type defined in the aliased module
   * provided in sources e.g. `alias.Context`
   */
  contextType: string;
  /**
   * Types that should not be matched for a backing type,
   *
   * By default this is set to ['Query', 'Mutation', 'Subscription']
   *
   * ```
   * skipTypes: ['Query', 'Mutation', /(.*?)Edge/, /(.*?)Connection/]
   * ```
   */
  skipTypes?: (string | RegExp)[];
  /**
   * If debug is set to true, this will log out info about all types
   * found, skipped, etc. for the type generation files.
   */
  debug?: boolean;
  /**
   * If provided this will be used for the backing types rather than the auto-resolve
   * mechanism above. Useful as an override for one-off cases, or for scalar
   * backing types.
   */
  backingTypeMap?: Record<string, string>;
}

export type TypeResolver<GenTypes, TypeName> = (
  source: AbstractResolveRoot<GenTypes, TypeName>,
  context: GetGen<GenTypes, "context">,
  info: GraphQLResolveInfo
) => MaybePromise<AbstractResolveReturn<GenTypes, TypeName>>;

export type AbstractResolveRoot<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["abstractResolveRoot"]
    ? GenTypes["abstractResolveRoot"][TypeName]
    : any
  : any;

export type AbstractResolveReturn<
  GenTypes,
  TypeName
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
  | "rootTypes"
  | "argTypes"
  | "returnTypes"
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
  | "abstractResolveRoot"
  | "abstractResolveReturn";

/**
 * Helpers for handling the generated schema
 */
export type GenTypesShape = Record<GenTypesShapeKeys, any>;

export type GetGen<
  GenTypes,
  K extends GenTypesShapeKeys,
  Fallback = any
> = GenTypes extends GenTypesShape ? GenTypes[K] : Fallback;

export type Or<T, Fallback> = T extends never ? Fallback : T;
export type Bool<T> = T extends never ? false : true;

export type GetGen2<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  Fallback = any
> = GenTypes extends GenTypesShape ? Or<GenTypes[K][K2], Fallback> : Fallback;

export type GetGen3<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>,
  Fallback = any
> = GenTypes extends GenTypesShape
  ? Or<GenTypes[K][K2][K3], Fallback>
  : Fallback;

export type GenHas2<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>
> = GenTypes extends GenTypesShape ? Bool<GenTypesShape[K][K2]> : false;

export type GenHas3<
  GenTypes,
  K extends GenTypesShapeKeys,
  K2 extends Extract<keyof GenTypesShape[K], string>,
  K3 extends Extract<keyof GenTypesShape[K][K2], string>
> = GenTypes extends GenTypesShape ? Bool<GenTypesShape[K][K2][K3]> : false;

export type EnumMembers<GenTypes, EnumName extends string> = any; // TODO!

export type RootValue<GenTypes, TypeName extends string> = GetGen2<
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
  GenTypes,
  TypeName extends string,
  FieldName extends string
> = GetGen3<GenTypes, "argTypes", TypeName, FieldName, {}>;

export type ResultValue<
  GenTypes,
  TypeName extends string,
  FieldName extends string,
  ResolveFallback
> = Or<GetGen3<GenTypes, "returnTypes", TypeName, FieldName>, ResolveFallback>;

export type InputValue<GenTypes, TypeName> = GetGen<GenTypes, "", any>;
// GenTypes extends GenTypesShape
// ? TypeName extends keyof GenTypes["inputTypes"]
//   ? FieldName extends keyof GenTypes["inputTypes"][TypeName]
//     ? GenTypes["inputTypes"][TypeName][FieldName]
//     : any
//   : any
// : never;

export type ContextValue<GenTypes> = GenTypes extends GenTypesShape
  ? GenTypes["context"]
  : any;

// -----
// Conditional Output Field Options
//
// Possibly the trickiest part of the typings, we conditionally
// determine whether the resolvers are required for the field, based on
// the field name and value of the root type associated with that field (if any).
//
// If the field is required, it must either have a resolver as a function, or
// an object with either a "resolver" or a "default" field. If it's not required,
// any of those can exist but they're not required.
// -----

// - If the field actually exists in the "root value"
//  - If the value of the root field is the expected type, and the field isn't nullable
//    - Then the resolver is optional
//    - Else if it's the wrong type, then we need a resolver / default for this field
// - Else field doesn't even exist in the root type, we need a resolver
export type ConditionalOutputFieldOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> = GenTypes extends GenTypesShape // If we actually have generated definitions
  ? FieldName extends keyof RootValue<GenTypes, TypeName> // And the field name is in the root value
    ? RootValueField<GenTypes, TypeName, FieldName> extends ResultValue<
        GenTypes,
        TypeName,
        FieldName,
        ResolveFallback
      > // And the root value matches up with a valid value for the result
      ? OptionalOutputOpts<GenTypes, TypeName, FieldName, ResolveFallback> // Then the result is optional
      : Extract<
          RootValueField<GenTypes, TypeName, FieldName>,
          null
        > extends null // If the root value can be null
      ? OptionalOutputOpts<GenTypes, TypeName, FieldName, ResolveFallback> // Then it's also optional
      : RequiredOutputOpts<GenTypes, TypeName, FieldName, ResolveFallback> // Otherwise it's required
    : RequiredOutputOpts<GenTypes, TypeName, FieldName, ResolveFallback> // If it's not in the root value, it's required
  : OptionalOutputOpts<GenTypes, TypeName, FieldName, ResolveFallback>; // If we don't have generated defs, it's optional

export type OptionalOutputOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> =
  | []
  | [
      OptionalResolverOutputFieldOpts<
        GenTypes,
        TypeName,
        FieldName,
        ResolveFallback
      >
    ]
  | [OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>];

export type RequiredOutputOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> =
  | [
      NeedsResolverOutputFieldOpts<
        GenTypes,
        TypeName,
        FieldName,
        ResolveFallback
      >
    ]
  | [OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>];

export interface OutputWithDefaultOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> extends CommonOutputOpts {
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>;
  default: MaybeThunk<
    ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>
  >;
}

export interface OutputWithResolveOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> extends CommonOutputOpts {
  resolve: OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>;
  default?: MaybeThunk<
    ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>
  >;
}

/**
 * The "Needs Resolver" output field opts means that the resolver cannot
 * be fulfilled by the "backing value" alone, and therefore needs either
 * a valid resolver or a "root value".
 */
export type NeedsResolverOutputFieldOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> =
  | OutputWithDefaultOpts<GenTypes, TypeName, FieldName, ResolveFallback>
  | OutputWithResolveOpts<GenTypes, TypeName, FieldName, ResolveFallback>;

/**
 * If we already have the correct value for the field from the root type,
 * then we can provide a resolver or a default value, but we don't have to.
 */
export interface OptionalResolverOutputFieldOpts<
  GenTypes,
  TypeName,
  FieldName,
  ResolveFallback
> extends CommonOutputOpts {
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName, ResolveFallback>;
  default?: MaybeThunk<
    ResultValue<GenTypes, TypeName, FieldName, ResolveFallback>
  >;
}
