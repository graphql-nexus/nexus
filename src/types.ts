import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
  GraphQLIsTypeOfFn,
  GraphQLResolveInfo,
  DirectiveLocationEnum,
  GraphQLDirective,
} from "graphql";
import {
  ObjectTypeDef,
  InputObjectTypeDef,
  InterfaceTypeDef,
  EnumTypeDef,
  UnionTypeDef,
} from "./core";
import { Metadata } from "./metadata";

export type NamedTypeDef =
  | ObjectTypeDef
  | InputObjectTypeDef
  | InterfaceTypeDef
  | EnumTypeDef
  | UnionTypeDef;

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
   * The description of the field, as defined in the GraphQL
   * object definition
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

export interface OutputFieldOpts<
  GenTypes = any,
  TypeName = any,
  FieldName = any
> extends FieldOpts {
  /**
   * Any arguments defined
   */
  args?: OutputFieldArgs;

  /**
   * Property to use to resolve the field. If resolve is specified, this field is ignored.
   */
  property?: Extract<keyof RootValue<GenTypes, TypeName>, string>;

  // /**
  //  * Subscription for the output field.
  //  */
  // subscribe?: (
  //   root: RootValue<GenTypes, TypeName>,
  //   args: ArgsValue<GenTypes, TypeName, FieldName>,
  //   context: ContextValue<GenTypes>,
  //   info: GraphQLResolveInfo
  // ) => ResultValue<GenTypes, TypeName, FieldName>;

  /**
   * Resolver for the output field
   */
  resolve?: (
    root: RootValue<GenTypes, TypeName>,
    args: ArgsValue<GenTypes, TypeName, FieldName>,
    context: ContextValue<GenTypes>,
    info: GraphQLResolveInfo
  ) => MaybePromise<ResultValue<GenTypes, TypeName, FieldName>>;

  /**
   * Default value for the field, if none is returned.
   */
  default?: MaybeThunk<ResultValue<GenTypes, TypeName, FieldName>>;
}

export interface AbstractFieldOpts<GenTypes, FieldName> extends FieldOpts {}

export type ModifyFieldOpts<GenTypes, TypeName, FieldName> = Omit<
  OutputFieldOpts<GenTypes, TypeName, FieldName>,
  "args" | "list" | "listItemNullable" | "nullable"
>;

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
   * Set a value for the input
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

  /**
   * The backing type for this object type. This can
   * also be set when constructing the schema.
   */
  rootType?: ImportedType | string;
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

export interface SchemaConfig<GenTypes> extends Nullability {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
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
   * Any configuration for type generation
   */
  typegen?: TypegenConfig<GenTypes> | (() => TypegenConfig<GenTypes>);
}

export interface TypegenConfig<GenTypes> {
  /**
   * A map of all types and what fields they can resolve to
   */
  rootTypes?: { [K in ObjectNames<GenTypes>]?: ImportedType | string };
  /**
   * The type of the context for the resolvers
   */
  contextType?: ImportedType | string;
  /**
   * An string or strings to prefix on the header of the TS file
   */
  header?: string | string[];
  /**
   * If you want to glob import from a file for use in the backing types,
   * you can use this as a convenience by specifying `{ importName: absolutePath }`
   * and the import will automatically be resolved relative to the `typegenPath`.
   */
  imports?: Record<string, string>;
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

/**
 * Generated type helpers:
 */

export type TypeResolver<GenTypes, TypeName> = (
  root: RootValue<GenTypes, TypeName>,
  context: ContextValue<GenTypes>,
  info: GraphQLResolveInfo
) => MaybePromise<Maybe<InterfaceMembers<GenTypes, TypeName>>>;

type GenTypesShapeKeys =
  | "context"
  | "argTypes"
  | "rootTypes"
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
  ? TypeName extends keyof GenTypes["rootTypes"]
    ? GenTypes["rootTypes"][TypeName]
    : any
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

export type RootTypeMap = Record<string, string | ImportedType | undefined>;
