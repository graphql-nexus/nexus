import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
  GraphQLIsTypeOfFn,
  GraphQLResolveInfo,
  DirectiveLocationEnum,
  GraphQLDirective,
  GraphQLSchema,
} from "graphql";
import {
  ObjectTypeDef,
  InputObjectTypeDef,
  InterfaceTypeDef,
  EnumTypeDef,
  UnionTypeDef,
} from "./core";
import { Metadata } from "./metadata";

export type NamedTypeDef<GenTypes = any> =
  | ObjectTypeDef<GenTypes, any>
  | InputObjectTypeDef<GenTypes, any>
  | InterfaceTypeDef<GenTypes, any>
  | EnumTypeDef<GenTypes>
  | UnionTypeDef<GenTypes>;

export enum NodeType {
  MIX = "MIX",
  FIELD = "FIELD",
  ENUM_MEMBER = "ENUM_MEMBER",
  UNION_MEMBER = "UNION_MEMBER",
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type BaseScalars = "String" | "Int" | "Float" | "ID" | "Boolean";

export type MaybePromise<T> = Promise<T> | T;

export type MaybeThunk<T> = T | (() => T);

export type Maybe<T> = T | null;

export type MixDef = {
  item: NodeType.MIX;
  typeName: string;
  mixOptions: MixOpts<any>;
};

export type FieldDef = {
  item: NodeType.FIELD;
  config: FieldConfig;
};

export type FieldConfig = InputFieldConfig | OutputFieldConfig;

export interface OutputFieldConfig extends OutputFieldOpts {
  name: string;
  type: any;
}

export interface InputFieldConfig extends InputFieldOpts {
  name: string;
  type: any;
}

export type FieldDefType = MixDef | FieldDef;

export type EnumDefType =
  | MixDef
  | { item: NodeType.ENUM_MEMBER; info: EnumMemberInfo };

export type UnionDefType =
  | MixDef
  | { item: NodeType.UNION_MEMBER; typeName: string };

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
  TypeMapDefs extends Record<string, GraphQLNamedType>,
  DirectiveDefs extends Record<string, GraphQLDirective>
> {
  typeMap: TypeMapDefs;
  metadata: Metadata;
  directiveMap: DirectiveDefs;
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
  pick?: Array<TMembers | { name: keyof TMembers; alias: string }>;
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
  /**
   * Any directives for the field or argument
   */
  directives?: DirectiveOption[];
}

export interface DirectiveOption {
  name: string;
  args: Record<string, any>;
}

export interface FieldOpts extends CommonOpts {
  /**
   * Whether the field can be returned or input as null
   * @default false
   */
  nullable?: boolean;
  /**
   * Whether the field returns a list of values, or just a single value.
   */
  list?: boolean;
  /**
   * Sets the list depth, for the rare cases where the depth is greater than 1
   */
  listDepth?: number;
  /**
   * Whether a member of the list can be a null value. If `list` is not true,
   * this option is ignored.
   *
   * If the listDepth is > 1, you can specify an Array of whether the
   * list should be nullable, otherwise it's assumed to be false
   */
  listItemNullable?: boolean | boolean[];
}

export interface ArgOpts extends FieldOpts {
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Whether the item in the list is required
   */
  requiredListItem?: boolean;
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
export interface CommonOutputOpts extends FieldOpts {
  /**
   * Any arguments defined
   */
  args?: OutputFieldArgs;
}

export interface OutputFieldOpts<
  GenTypes = any,
  TypeName = any,
  FieldName = any
> extends CommonOutputOpts {
  /**
   * Resolver for the output field
   */
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName>;

  /**
   * Default value for the field, if none is returned.
   */
  default?: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;

  // /**
  //  * Subscription for the output field.
  //  */
  // subscribe?: OutputFieldResolver<GenTypes, TypeName, FieldName>
}

export type OutputFieldResolver<GenTypes, TypeName, FieldName> = (
  root: RootValue<GenTypes, TypeName>,
  args: ArgsValue<GenTypes, TypeName, FieldName>,
  context: ContextValue<GenTypes>,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<GenTypes, TypeName, FieldName>>;

/**
 * All properties that can be changed about a field
 */
export type ModifyFieldOpts<GenTypes, TypeName, FieldName> = {
  /**
   * The description of the field, as defined in the GraphQL object definition.
   */
  description?: string;
  /**
   * Resolver for the output field
   */
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName>;
  /**
   * Default value for the field, if none is returned.
   */
  default?: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;
};

export interface InputFieldOpts<GenTypes = any, TypeName = any>
  extends FieldOpts {
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

interface HasFields {
  fields: FieldDefType[];
}

interface HasDirectives {
  directives: DirectiveOption[];
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

export interface EnumTypeConfig extends Named, HasDirectives, SharedTypeConfig {
  members: EnumDefType[];
}

export interface UnionTypeConfig
  extends Named,
    HasDirectives,
    SharedTypeConfig {
  members: UnionDefType[];
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: TypeResolver<any, any>;
}

export interface InputTypeConfig
  extends Named,
    HasFields,
    HasDirectives,
    SharedTypeConfig,
    Nullability {}

export interface ObjectTypeConfig
  extends Named,
    HasFields,
    HasDirectives,
    SharedTypeConfig,
    Nullability,
    DefaultResolver {
  /**
   * All interfaces the object implements.
   */
  interfaces: string[];

  /**
   * Any modifications to the field config
   */
  fieldModifications: Record<string, ModifyFieldOpts<any, any, any>>;

  /**
   * An (optional) isTypeOf check for the object type
   */
  isTypeOf?: GraphQLIsTypeOfFn<any, any>;
}

export interface AbstractTypeConfig {
  fields: FieldConfig[];
}

export interface DirectiveTypeConfig extends Named {
  description?: string;
  locations: DirectiveLocationEnum[];
  directiveArgs: DirectiveArgDefinition[];
}

export interface InterfaceTypeConfig
  extends Named,
    HasFields,
    HasDirectives,
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

export interface BuilderConfig extends Nullability {
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
  typegenConfig?: ((
    schema: GraphQLSchema,
    outputPath: string
  ) => TypegenInfo | PromiseLike<TypegenInfo>);
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

export interface TypegenInfo<GenTypes = any> {
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
  backingTypeMap: { [K in ObjectNames<GenTypes>]?: string };
  /**
   * The type of the context for the resolvers
   */
  contextType: string;
}

export interface NullabilityConfig {
  /**
   * Whether non-list output fields can return null by default
   *
   * type Example {
   *   field: String!
   * }
   *
   * @default false
   */
  output?: boolean;
  /**
   * Whether outputs that return lists can be null by default
   *
   * type Example {
   *   field: [String]!
   * }
   *
   * @default false
   */
  outputList?: boolean;
  /**
   * Whether non-list output fields can return null by default
   *
   * type Example {
   *   field: [String!]
   * }
   *
   * @default false
   */
  outputListItem?: boolean;
  /**
   * Whether non-list input fields (field arguments, input type members) are nullable by default
   *
   * input Example {
   *   field: String
   * }
   *
   * @default true
   */
  input?: boolean;
  /**
   * Whether input fields that are lists are nullable by default
   *
   * input Example {
   *   field: [String]
   * }
   *
   * @default true
   */
  inputList?: boolean;
  /**
   * Whether any members of input list item values can be null by default
   *
   * input Example {
   *   field: [String!]
   * }
   *
   * @default false
   */
  inputListItem?: boolean;
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
  root: RootValue<GenTypes, TypeName>,
  context: ContextValue<GenTypes>,
  info: GraphQLResolveInfo
) => MaybePromise<Maybe<InterfaceMembers<GenTypes, TypeName>>>;

/**
 * Generated type helpers:
 */

type GenTypesShapeKeys =
  | "context"
  | "argTypes"
  | "backingTypes"
  | "returnTypes"
  | "enums"
  | "objects"
  | "interfaces"
  | "unions"
  | "scalars"
  | "inputObjects"
  | "allInputTypes"
  | "allOutputTypes";

/**
 * Helpers for handling the generated schema
 */
export type GenTypesShape = Record<GenTypesShapeKeys, any>;

export type ObjectNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypes["objects"], string>
  : never;

export type InterfaceMembers<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["interfaces"]
    ? GenTypes["interfaces"][TypeName]
    : any
  : never;

export type UnionMembers<GenTypes, TypeName> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["unions"]
    ? GenTypes["unions"][TypeName]
    : any
  : never;

export type EnumNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypes["enums"], string>
  : never;

export type UnionNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypes["unions"], string>
  : never;

export type ObjectTypeFields<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["returnTypes"]
    ? Extract<keyof GenTypes["returnTypes"][TypeName], string>
    : never
  : unknown;

export type EnumMembers<
  GenTypes,
  EnumName extends string
> = GenTypes extends GenTypesShape
  ? EnumName extends keyof GenTypes["enums"]
    ? GenTypes["enums"][EnumName]
    : never
  : string;

export type ObjectTypeDef<GenTypes, TypeName> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["objects"]
    ? GenTypes["objects"][TypeName]["rootType"]
    : never
  : string;

export type InputObjectTypeDef<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["inputObjects"]
    ? GenTypes["inputObjects"][TypeName]
    : never
  : unknown;

export type AllInterfaces<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypes["interfaces"], string>
  : never;

export type AllInputTypes<GenTypes> = GenTypes extends GenTypesShape
  ? GenTypes["allInputTypes"]
  : never;

export type AllOutputTypes<GenTypes> = GenTypes extends GenTypesShape
  ? GenTypes["allOutputTypes"]
  : never;

export type RootValue<GenTypes, TypeName> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["backingTypes"]
    ? GenTypes["backingTypes"][TypeName]
    : any
  : never;

export type RootValueField<
  GenTypes,
  TypeName,
  FieldName
> = FieldName extends keyof RootValue<GenTypes, TypeName>
  ? RootValue<GenTypes, TypeName>[FieldName]
  : never;

export type ArgsValue<
  GenTypes,
  TypeName,
  FieldName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["argTypes"]
    ? FieldName extends keyof GenTypes["argTypes"][TypeName]
      ? GenTypes["argTypes"][TypeName][FieldName]
      : any
    : {}
  : never;

export type ResultValue<
  GenTypes,
  TypeName,
  FieldName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["returnTypes"]
    ? FieldName extends keyof GenTypes["returnTypes"][TypeName]
      ? GenTypes["returnTypes"][TypeName][FieldName]
      : any
    : any
  : never;

export type InputValue<GenTypes, TypeName> = any;
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

export type DirectiveConfig<GenTypes, DirectiveName> = {
  locations: DirectiveLocationEnum[];
  args?: [];
};

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
  GenTypes = any,
  TypeName = any,
  FieldName = any
> = FieldName extends keyof RootValue<GenTypes, TypeName>
  ? RootValueField<GenTypes, TypeName, FieldName> extends ResultValue<
      GenTypes,
      TypeName,
      FieldName
    >
    ? OptionalOutputOpts<GenTypes, TypeName, FieldName>
    : Extract<RootValueField<GenTypes, TypeName, FieldName>, null> extends null
    ? OptionalOutputOpts<GenTypes, TypeName, FieldName>
    : RequiredOutputOpts<GenTypes, TypeName, FieldName>
  : RequiredOutputOpts<GenTypes, TypeName, FieldName>;

export type OptionalOutputOpts<GenTypes, TypeName, FieldName> =
  | []
  | [OptionalResolverOutputFieldOpts<GenTypes, TypeName, FieldName>]
  | [OutputFieldResolver<GenTypes, TypeName, FieldName>];

export type RequiredOutputOpts<GenTypes, TypeName, FieldName> =
  | [NeedsResolverOutputFieldOpts<GenTypes, TypeName, FieldName>]
  | [OutputFieldResolver<GenTypes, TypeName, FieldName>];

export interface OutputWithDefaultOpts<GenTypes, TypeName, FieldName>
  extends CommonOutputOpts {
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName>;
  default: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;
}

export interface OutputWithResolveOpts<GenTypes, TypeName, FieldName>
  extends CommonOutputOpts {
  resolve: OutputFieldResolver<GenTypes, TypeName, FieldName>;
  default?: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;
}

/**
 * The "Needs Resolver" output field opts means that the resolver cannot
 * be fulfilled by the "backing value" alone, and therefore needs either
 * a valid resolver or a "root value".
 */
export type NeedsResolverOutputFieldOpts<GenTypes, TypeName, FieldName> =
  | OutputWithDefaultOpts<GenTypes, TypeName, FieldName>
  | OutputWithResolveOpts<GenTypes, TypeName, FieldName>;

/**
 * If we already have the correct value for the field from the root type,
 * then we can provide a resolver or a default value, but we don't have to.
 */
export interface OptionalResolverOutputFieldOpts<GenTypes, TypeName, FieldName>
  extends CommonOutputOpts {
  resolve?: OutputFieldResolver<GenTypes, TypeName, FieldName>;
  default?: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;
}
