import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
  GraphQLTypeResolver,
  GraphQLIsTypeOfFn,
} from "graphql";
import * as Gen from "./gen";
import { GQLiteralAbstract } from "./objects";

export enum NodeType {
  MIX = "MIX",
  FIELD = "FIELD",
  MIX_ABSTRACT = "MIX_ABSTRACT",
  ENUM_MEMBER = "ENUM_MEMBER",
  UNION_MEMBER = "UNION_MEMBER",
}

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * This allows us to actually use the root type when defining types.
 *
 * If the resolver and the property are both undefined, or if they don't exist at all,
 * the field name should be a key of the root value, or at least have a default value
 * otherwise it'll be undefined, which is more-often-than not user error.
 */
export type FieldName<Root, Opts> = Opts extends {
  resolve?: infer R;
  property?: infer P;
}
  ? R extends undefined
    ? (P extends undefined ? Extract<keyof Root, string> : string)
    : string
  : Opts extends { defaultValue?: string }
    ? string
    : Extract<keyof Root, string>;

export type GQLTypes = "ID" | "String" | "Int" | "Float" | string;

export type MixDef = {
  item: NodeType.MIX;
  typeName: string;
  mixOptions: MixOpts<any>;
};

export type MixAbstractDef = {
  item: NodeType.MIX_ABSTRACT;
  type: GQLiteralAbstract<any>;
  mixOptions: MixOpts<any>;
};

export type FieldDef = {
  item: NodeType.FIELD;
  config: FieldConfig;
};

export interface FieldConfig extends OutputFieldOpts<any, any, any> {
  name: string;
  type: GQLTypes;
}

export type FieldDefType = MixDef | MixAbstractDef | FieldDef;

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
   * Whether the field / property is even considered to be defined on the schema.
   * Useful if you want to feature-flag
   */
  availableIf?: any;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string | DeprecationInfo;
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
   * Whether a member of the list can be a null value. If `list` is not true,
   * this option is ignored.
   * @default false
   */
  listItemNullable?: boolean;
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

export type ArgDefinition = Readonly<
  ArgOpts & {
    type: any; // TODO: Make type safe
  }
>;

export interface ObjTypeDef {
  root: any;
  context: any;
  args: { [argName: string]: any };
}

type FieldResolver<
  GenTypes,
  TypeName,
  FieldName
> = GenTypes extends Gen.GenTypesShape
  ? GraphQLFieldResolver<any, any>
  : GraphQLFieldResolver<any, any>;

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
  property?: Extract<keyof any, string>;
  /**
   * Resolver for the output field
   */
  resolve?: FieldResolver<GenTypes, TypeName, FieldName>;
  /**
   * Default value for the field, if none is returned.
   */
  defaultValue?: any;
}

export interface InputFieldOpts extends FieldOpts {}

export interface ScalarOpts
  extends Omit<
      GraphQLScalarTypeConfig<any, any>,
      "name" | "astNode" | "extensionASTNodes"
    > {
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: string | DeprecationInfo;
}

interface HasFields {
  fields: FieldDefType[];
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
  nullabilityConfig?: NullabilityConfig;
}

export interface EnumTypeConfig extends Named, SharedTypeConfig {
  members: EnumDefType[];
}

export interface UnionTypeConfig extends Named, SharedTypeConfig {
  members: UnionDefType[];
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: GraphQLTypeResolver<any, any>;
}

export interface InputTypeConfig
  extends Named,
    HasFields,
    SharedTypeConfig,
    Nullability {}

export interface ObjectTypeConfig
  extends Named,
    HasFields,
    SharedTypeConfig,
    Nullability,
    DefaultResolver {
  /**
   * All interfaces the object implements.
   */
  interfaces: Gen.InterfaceName<any>[];

  /**
   * An (optional) isTypeOf check for the object type
   */
  isTypeOf?: GraphQLIsTypeOfFn<any, any>;
}

export interface AbstractTypeConfig extends HasFields {}

export interface InterfaceTypeConfig
  extends Named,
    HasFields,
    SharedTypeConfig,
    Nullability,
    DefaultResolver {
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: GraphQLTypeResolver<any, any>;
}

export interface SchemaConfig extends Nullability, DefaultResolver {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
  /**
   * Absolute path to where the GraphQL IDL file should be written
   */
  definitionFilePath?: string;
  /**
   * Generates the types for intellisense/typescript
   */
  typeGeneration?: (printedSchema: string) => Promise<void>;
}

export type NullabilityConfig = {
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
};

export type GetTypeFn = (t: string) => GraphQLNamedType;

export type ResolveType<GenTypes, TypeName> = (
  root: Gen.RootType<GenTypes, TypeName>
) => Gen.InterfaceName<GenTypes>;
