import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLIsTypeOfFn,
} from "graphql";
import { addMix } from "./utils";
import { SchemaBuilder } from "./builder";
import { GQLiteralArg } from "./definitions";

export type GQLiteralNamedType =
  | GQLiteralEnumType
  | GQLiteralObjectType<any, any>
  | GQLiteralInterfaceType<any, any>
  | GQLiteralUnionType
  | GQLiteralInputObjectType;

/**
 * Backing type for an enum member.
 */
export class GQLiteralEnumType<GenTypes = any> {
  protected typeConfig: Types.EnumTypeConfig;

  constructor(protected name: string) {
    this.typeConfig = {
      name,
      members: [],
    };
  }

  mix<EnumName extends string>(
    typeName: Types.EnumName<GenTypes>,
    mixOptions?: Types.MixOpts<Types.EnumMembers<GenTypes, EnumName>>
  ) {
    this.typeConfig.members.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: mixOptions || {},
    });
  }

  member(name: string, config?: Types.EnumMemberConfig) {
    this.typeConfig.members.push({
      item: Types.NodeType.ENUM_MEMBER,
      info: {
        name,
        value: name,
        ...config,
      },
    });
  }

  /**
   * Sets the members of the enum
   */
  members(info: Array<Types.EnumMemberInfo | string>) {
    info.forEach((info) => {
      if (typeof info === "string") {
        return this.typeConfig.members.push({
          item: Types.NodeType.ENUM_MEMBER,
          info: { name: info, value: info },
        });
      }
      this.typeConfig.members.push({
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
  buildType(builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType(this.typeConfig);
  }
}

export class GQLiteralUnionType<GenTypes = any, TypeName extends string = any> {
  protected typeConfig: Types.UnionTypeConfig;

  constructor(protected name: string) {
    this.typeConfig = {
      name,
      members: [],
    };
  }

  mix<UnionTypeName extends string>(
    type: UnionTypeName,
    options?: Types.MixOpts<any>
  ) {
    this.typeConfig.members.push({
      item: Types.NodeType.MIX,
      typeName: type,
      mixOptions: {},
    });
  }

  members(...types: string[]) {
    types.forEach((typeName) => {
      this.typeConfig.members.push({
        item: Types.NodeType.UNION_MEMBER,
        typeName,
      });
    });
  }

  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType(typeResolver: Types.ResolveType<GenTypes, TypeName>) {
    // @ts-ignore
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLUnionType {
    return builder.unionType(this.typeConfig);
  }
}

abstract class FieldsArgs {
  idArg(options?: Types.ArgOpts) {
    return GQLiteralArg("ID", options);
  }

  intArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Int", options);
  }

  floatArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Float", options);
  }

  boolArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Bool", options);
  }

  stringArg(options?: Types.ArgOpts) {
    return GQLiteralArg("String", options);
  }
}

export class GQLiteralObjectType<
  GenTypes = any,
  TypeName extends string = any
> extends FieldsArgs {
  /**
   * All metadata about the object type
   */
  protected typeConfig: Types.ObjectTypeConfig;

  constructor(name: string) {
    super();
    this.typeConfig = {
      name,
      fields: [],
      interfaces: [],
    };
  }

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(
    typeName: string | GQLiteralAbstract<GenTypes>,
    mixOptions?: Types.MixOpts<any>
  ) {
    addMix(this.typeConfig, typeName, mixOptions);
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllOutputTypes<GenTypes>,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.typeConfig.fields.push({
      item: Types.NodeType.FIELD,
      config: {
        name,
        type,
        ...options,
      },
    });
  }

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  implements(...interfaceName: Types.AllInterfaces<GenTypes>[]) {
    this.typeConfig.interfaces.push(...interfaceName);
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
  isTypeOf(fn: (value: GraphQLIsTypeOfFn<any, any>) => boolean) {
    this.typeConfig.isTypeOf = fn;
  }

  /**
   * Used to modify a field already defined on an interface.
   * At this point the type will not change, but the resolver,
   * defaultValue, property, or description fields can.
   */
  modify<FieldName extends string>(
    field: FieldName,
    options?: Types.ModifyFieldOpts<GenTypes, TypeName, FieldName>
  ) {}

  /**
   * Supply the default field resolver for all members of this type
   */
  defaultResolver(
    resolverFn: GraphQLFieldResolver<
      Types.RootValue<GenTypes, TypeName>,
      Types.ContextValue<GenTypes>
    >
  ) {
    this.typeConfig.defaultResolver = resolverFn;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder) {
    return builder.objectType(this.typeConfig);
  }
}

export class GQLiteralInterfaceType<
  GenTypes = any,
  TypeName extends string = any
> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.InterfaceTypeConfig;

  constructor(protected name: string) {
    this.typeConfig = {
      name,
      fields: [],
    };
  }

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(
    typeName: string | GQLiteralAbstract<GenTypes>,
    mixOptions?: Types.MixOpts<any>
  ) {
    addMix(this.typeConfig, typeName, mixOptions);
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllOutputTypes<GenTypes>,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.typeConfig.fields.push({
      item: Types.NodeType.FIELD,
      config: {
        name,
        type,
        ...options,
      },
    });
  }

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
    // @ts-ignore
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType(this.typeConfig);
  }
}

export class GQLiteralInputObjectType<
  GenTypes = any,
  TypeName extends string = any
> {
  protected typeConfig: Types.InputTypeConfig;

  constructor(protected name: string) {
    this.typeConfig = {
      name,
      fields: [],
    };
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes>,
    options?: Types.OutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.typeConfig.fields.push({
      item: Types.NodeType.FIELD,
      config: {
        name,
        type,
        ...options,
      },
    });
  }

  description(description: string) {
    this.typeConfig.description = description;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLInputObjectType {
    return builder.inputObjectType(this.typeConfig);
  }
}

/**
 * A `GQLiteralAbstractType` contains fields that can be shared among `GQLiteralObjectType`,
 * `GQLiteralInterface`, `GQLiteralInputObjectType` or other `GQLiteralAbstractType`s
 *
 * Use the `.mix` to mixin the abstract type fields.
 */
export class GQLiteralAbstract<GenTypes> extends FieldsArgs {
  protected typeConfig: Types.AbstractTypeConfig;

  constructor() {
    super();
    this.typeConfig = {
      fields: [],
    };
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    // @ts-ignore
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes>,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.typeConfig.fields.push({
      item: Types.NodeType.FIELD,
      config: {
        name,
        type,
        ...options,
      },
    });
  }
}
