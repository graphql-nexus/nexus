import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
  GraphQLTypeResolver,
} from "graphql";

declare global {
  namespace GQLiteral { export interface Context {} }
}

export enum NodeType {
  MIX = "MIX",
  MIX_ABSTRACT = "MIX_ABSTRACT",
  FIELD = "FIELD",
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

export type GQLArgTypes = "ID" | "String" | "Int" | "Float" | string;

export interface GQLArgOpts {
  /**
   * Whether
   */
  required?: boolean;
  /**
   * Whether the item in the
   */
  requiredItem?: boolean;
  /**
   *
   */
  list?: boolean;
}

export type MixDef<Members extends string> = {
  item: NodeType.MIX;
  typeName: string;
  mixOptions: GQLiteralMixOptions<Members>;
};

export type MixAbstractDef<Members extends string> = {
  item: NodeType.MIX_ABSTRACT;
  typeName: string;
  mixOptions: GQLiteralMixOptions<Members>;
};

export type FieldDef<ObjType> = {
  item: NodeType.FIELD;
  fieldName: string;
  fieldType: GQLTypes;
  fieldOptions: GQLiteralOutputFieldOptions<ObjType>;
};

export type FieldDefType<GenTypes, ObjType = any> =
  | MixDef<GenTypes>
  | MixAbstractDef<any>
  | FieldDef<ObjType>;

export type EnumDefType =
  | MixDef
  | { item: NodeType.ENUM_MEMBER; info: GQLiteralEnumMemberInfo };

export type UnionTypeDef =
  | MixDef
  | { item: NodeType.UNION_MEMBER; typeName: string };

export interface GQLiteralEnumMemberInfo {
  value: string;
  internalValue: string;
  description?: string;
}

/**
 * When you're mixing types/partials, you can pick or omit
 * fields from the types you're mixing in.
 */
export interface GQLiteralMixOptions<TMembers extends string> {
  pick?: Array<TMembers>;
  omit?: Array<TMembers>;
}

export interface GQLiteralDeprecationInfo {
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

export interface GQLiteralCommonOptions {
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
  deprecation?: GQLiteralDeprecationInfo;
  /**
   * Default value for the field, if none is returned.
   */
  defaultValue?: any;
}

export interface GQLiteralArgument {
  /**
   * The name of the argument
   */
  argName: string;
  /**
   * The value for a field,
   */
  argType: string;
  /**
   * The "default value" for the arg, if none is passed.
   */
  defaultValue?: string;
}

export interface GQLiteralOutputFieldOptions<ObjType>
  extends GQLiteralCommonOptions {
  /**
   * Whether the field can be returned or input as null
   * @default false
   */
  nullable?: boolean;
  /**
   * Any arguments defined
   */
  args?: GQLiteralArgument[];
  /**
   * Property to use to resolve the field. If resolve is specified, this field is ignored.
   */
  property?: Extract<keyof Root, string>;
  /**
   * Resolver for the output field
   */
  resolve?: GraphQLFieldResolver<Root, GQLiteral.Context>;
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

export interface GQLiteralInputFieldOptions extends GQLiteralCommonOptions {
  /**
   * Default value for the input field, if one is not provided.
   */
  defaultValue?: any;
}

export interface GQLiteralScalarOptions
  extends Omit<
      GraphQLScalarTypeConfig<any, any>,
      "name" | "astNode" | "extensionASTNodes"
    > {
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: GQLiteralDeprecationInfo;
}

export interface GQLiteralTypeMetadata {
  /**
   * Description for a GraphQL type
   */
  description?: string;
  /**
   * An (optional) isTypeOf check for the object type
   */
  isTypeOf?: ((value: any) => boolean);
}

export interface GQLiteralInterfaceMetadata {
  /**
   * Description for a GraphQL type
   */
  description?: string;
  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType?: GraphQLTypeResolver<any, any>;
}

export interface GQLiteralSchemaConfig {
  /**
   * All of the GraphQL types
   */
  types: any[];
}

export interface GQLiteralArgOptions {
  /**
   * Whether this argument should be required
   */
  required?: boolean;
}

/**
 * Helpers for handling the generated schema
 */

export interface GenTypesShape {
  interfaces: string;
  enums: string;
  enumTypes: Record<string, string>;
  objectTypes: Record<string, object>;
  inputObjectTypes: Record<string, object>;
}

export type GetTypeFn = (t: string) => GraphQLNamedType;

export type FieldTypeNames<S> = S extends any ? string : string;

export type InterfaceNames<S> = S extends { interfaces: string }
  ? S["interfaces"]
  : string;

type EnumMemberFor<Schema, EnumName> = TypeName extends keyof Schema
  ? Schema[TypeName]
  : any;

type TypeDefFor<Schema, TypeName> = TypeName extends keyof Schema
  ? Schema[TypeName]
  : any;
