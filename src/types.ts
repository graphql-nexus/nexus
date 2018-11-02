import { NodeType } from "./enums";
import {
  GraphQLFieldResolver,
  GraphQLScalarTypeConfig,
  GraphQLNamedType,
} from "graphql";

declare global {
  namespace GQLit { export interface Context {} }
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

export type FieldDefType<Opts, ListOpts> =
  | { type: NodeType.MIX; typeName: string; mixOptions: GQLitMixOptions }
  | {
      type: NodeType.FIELD;
      fieldName: string;
      fieldType: GQLTypes;
      fieldOptions: Opts;
    }
  | {
      type: NodeType.LIST;
      fieldName: string;
      fieldType: GQLTypes;
      fieldOptions: ListOpts;
    };

export type EnumDefType =
  | { type: NodeType.MIX; typeName: string; mixOptions: GQLitMixOptions }
  | { type: NodeType.ENUM_MEMBER; info: GQLitEnumMemberInfo };

export type UnionTypeDef =
  | { type: NodeType.MIX; typeName: string; mixOptions: GQLitMixOptions }
  | { type: NodeType.ENUM_MEMBER; typeName: string };

export interface GQLitEnumMemberInfo {
  value: string;
  internalValue: string;
  description?: string;
}

/**
 * When you're mixing types/partials, you can pick or omit
 * fields from the types you're mixing in.
 */
export interface GQLitMixOptions {
  pick?: string[];
  omit?: string[];
}

export interface GQLitDeprecationInfo {
  /**
   * Date | YYYY-MM-DD formatted date of when this field
   * became deprecated.
   */
  startDate: string | Date;
  /**
   * Reason for the deprecation.
   */
  reason: string;
  /**
   * Field or usage that replaces the deprecated field.
   */
  supersededBy: string;
}

export interface GQLitCommonOptions {
  /**
   * Whether the field can be returned or input as null
   * @default false
   */
  nullable?: boolean;
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
  deprecation?: GQLitDeprecationInfo;
}

export interface GQLitArgument {
  /**
   * The name of the argument
   */
  name: string;
  /**
   * The value for a field, either a type, like "String" or a
   * GraphQL input object type name.
   */
  value: string;
  /**
   * The "default value" for the field, if none is passed.
   */
  defaultValue?: string;
}

export interface GQLitFieldOptions<Root> extends GQLitCommonOptions {
  /**
   * Any arguments defined
   */
  args?: GQLitArgument[];
  /**
   * Property to use to resolve the field
   */
  property?: Extract<keyof Root, string>;
  /**
   * Resolver used to resolve the field.
   */
  resolve?: GraphQLFieldResolver<Root, GQLit.Context>;
  /**
   * Default value for the field, if none is returned.
   */
  defaultValue?: any;
}

export interface GQLitInputFieldOptions extends GQLitCommonOptions {
  /**
   * Default value for the input field, if one is not provided.
   */
  defaultValue?: any;
}

export interface GQLitListOptions<Root> extends GQLitCommonOptions {
  /**
   * Whether the list item can be a null value
   * @default false
   */
  itemNull?: boolean;
  /**
   * Resolves the list
   */
  resolve?: GraphQLFieldResolver<Root, GQLit.Context>;
}

export interface GQLitScalarOptions
  extends Omit<
      GraphQLScalarTypeConfig<any, any>,
      "name" | "astNode" | "extensionASTNodes"
    > {
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: GQLitDeprecationInfo;
}

export interface GQLitTypeMetadata {
  /**
   * Description for a GraphQL type
   */
  description?: string;
  /**
   * An (optional) isTypeOf check for the object type
   */
  isTypeOf?: ((value: any) => boolean);
}

export interface GQLitSchemaConfig {
  /**
   * All of the GraphQL types
   */
  types: any[];
}

export type GetTypeFn = <T>(t: string) => T;

export type FieldTypeNames<S> = S extends any ? string : string;

export type InterfaceNames<S> = S extends any ? string : string;
