import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
} from "graphql";
import { GQLiteralGen } from "../generatedTypes";
import * as Gen from "./gen";
import { SchemaBuilder } from "./utils";

export type GQLiteralNamedType =
  | GQLiteralEnumType
  | GQLiteralObjectType<any, any>
  | GQLiteralInterfaceType<any, any>
  | GQLiteralUnionType
  | GQLiteralInputObjectType;

/**
 * Backing type for an enum member.
 */
export class GQLiteralEnumType<GenTypes = GQLiteralGen> {
  protected typeConfig: Types.EnumTypeConfig = {};
  protected enumMembers: Types.EnumDefType[] = [];

  mix<EnumName extends string>(
    typeName: Gen.EnumName<GenTypes>,
    mixOptions?: Types.MixOpts<Gen.EnumMembers<GenTypes, EnumName>>
  ) {
    this.enumMembers.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  /**
   * Sets the members of the enum
   */
  members(info: Array<Types.EnumMemberInfo | string>) {
    info.forEach((info) => {
      if (typeof info === "string") {
        return this.enumMembers.push({
          item: Types.NodeType.ENUM_MEMBER,
          info: { name: info, value: info },
        });
      }
      this.enumMembers.push({
        item: Types.NodeType.ENUM_MEMBER,
        info,
      });
    });
  }

  /**
   * Any description about the enum type.
   */
  description(description: string) {
    this.typeConfig.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   *
   * The GQLiteralEnumType requires the typeData arg because it
   * needs to synchronously return and therefore must check for / break
   * circular references when mixing.
   */
  buildType(typeName: string, builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType({
      name: typeName,
      members: this.enumMembers,
      typeConfig: this.typeConfig,
    });
  }
}

export class GQLiteralUnionType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> {
  protected typeConfig: Types.UnionTypeConfig = {};
  protected unionMembers: Types.UnionTypeDef[] = [];

  mix<UnionTypeName extends string>(
    type: UnionTypeName,
    options?: Types.MixOpts<any>
  ) {
    this.unionMembers.push({
      item: Types.NodeType.MIX,
      typeName: type,
      mixOptions: {},
    });
  }

  members(...types: string[]) {
    types.forEach((typeName) => {
      this.unionMembers.push({ item: Types.NodeType.UNION_MEMBER, typeName });
    });
  }

  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType(typeResolver: Types.ResolveType<GenTypes, TypeName>) {
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(typeName: string, builder: SchemaBuilder): GraphQLUnionType {
    return builder.unionType({
      name: typeName,
      members: this.unionMembers,
      typeConfig: this.typeConfig,
    });
  }
}

abstract class GQLitWithFields<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> {
  protected fields: Types.FieldDefType[] = [];

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: Types.MixOpts<any>) {
    this.fields.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.GQLTypes,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.fields.push({
      item: Types.NodeType.FIELD,
      fieldName: name,
      fieldType: type,
      fieldOptions: options || ({} as any),
    });
  }
}

export class GQLiteralObjectType<
  GenTypes,
  TypeName extends string = any
> extends GQLitWithFields<GenTypes, TypeName> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.ObjectTypeConfig = {};

  /**
   * All interfaces the object implements.
   */
  protected interfaces: Gen.InterfaceName<GenTypes>[] = [];

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  implements(...interfaceName: Gen.InterfaceName<GenTypes>[]) {
    this.interfaces.push(...interfaceName);
  }

  /**
   * Adds a description to the metadata for the object type.
   */
  description(description: string) {
    this.typeConfig.description = description;
  }

  /**
   * Adds an "isTypeOf" check to the object type.
   */
  isTypeOf(fn: (value: any) => boolean) {
    this.typeConfig.isTypeOf = fn;
  }

  /**
   * Supply the default field resolver for all members of this type
   */
  defaultResolver(resolverFn: GraphQLFieldResolver<any, any>) {
    this.typeConfig.defaultResolver = resolverFn;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(typeName: string, builder: SchemaBuilder) {
    return builder.objectType({
      name: typeName,
      fields: this.fields,
      typeConfig: this.typeConfig,
      interfaces: this.interfaces,
    });
  }
}

export class GQLiteralInterfaceType<
  GenTypes,
  TypeName extends string
> extends GQLitWithFields<GenTypes, TypeName> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.UnionTypeConfig = {};

  /**
   * Adds a description to the metadata for the interface type.
   */
  description(description: string) {
    this.typeConfig.description = description;
  }

  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType(typeResolver: Types.ResolveType<GenTypes, TypeName>) {
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(typeName: string, builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType({
      name: typeName,
      fields: this.fields,
      typeConfig: this.typeConfig,
    });
  }
}

export class GQLiteralInputObjectType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> extends GQLitWithFields<GenTypes, TypeName> {
  protected typeConfig: Types.InputTypeConfig = {};

  description(description: string) {
    this.typeConfig.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(typeName: string, builder: SchemaBuilder): GraphQLInputObjectType {
    return builder.inputObjectType({
      name: typeName,
      fields: this.fields,
      typeConfig: this.typeConfig,
    });
  }
}

/**
 * A `GQLiteralAbstractType` contains fields that can be shared among `GQLiteralObjectType`,
 * `GQLiteralInterface`, `GQLiteralInputObjectType` or other `GQLiteralAbstractType`s
 *
 * Use the `.mix` to mixin the abstract type fields.
 */
export class GQLiteralAbstract<GenTypes> extends GQLitWithFields<
  GenTypes,
  never
> {}

// Ignoring these, since they're only provided for a better developer experience,
// we don't want these to actually be picked up by intellisense.
// @ts-ignore
GQLiteralAbstract.prototype.implements = function() {
  throw new Error(`
    Oops, looks like you are trying to call "implements" on an abstract type definition.
    Abstract types cannot implement interfaces, as they are not concrete types.
    Call .implements() on the concrete type that uses this AbstractType instead.
  `);
};
