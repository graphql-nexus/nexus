import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLIsTypeOfFn,
  DirectiveLocationEnum,
} from "graphql";
import { dedent } from "./utils";
import { SchemaBuilder, isGraphQLiteralNamedType } from "./builder";
import { arg } from "./definitions";
import { GraphQLiteralMetadata } from "./metadata";

// Export the ts definitions so they can be used by library authors under `core.Types`
export { Types };

// Same as above, export all core things under the "core" namespace
export { SchemaBuilder, isGraphQLiteralNamedType, GraphQLiteralMetadata };

declare global {
  interface GraphQLiteralGen {}
}

export type GraphQLiteralNamedType =
  | GraphQLiteralEnumType<any>
  | GraphQLiteralObjectType<any, any>
  | GraphQLiteralInterfaceType<any, any>
  | GraphQLiteralUnionType<any, any>
  | GraphQLiteralInputObjectType<any>;

/**
 * Backing type for an enum member.
 */
export class GraphQLiteralEnumType<GenTypes = GraphQLiteralGen> {
  protected typeConfig: Types.EnumTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      members: [],
      directives: [],
    };
  }

  mix<EnumName extends Types.EnumNames<GenTypes>>(
    typeName: EnumName,
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
    info.forEach((member) => {
      if (typeof member === "string") {
        return this.typeConfig.members.push({
          item: Types.NodeType.ENUM_MEMBER,
          info: { name: member, value: member },
        });
      }
      this.typeConfig.members.push({
        item: Types.NodeType.ENUM_MEMBER,
        info: member,
      });
    });
  }

  /**
   * Any description about the enum type.
   */
  description(description: string) {
    this.typeConfig.description = dedent(description);
  }

  /**
   * Should be used very rarely, adds a directive directly to the
   * enum definition - for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>) {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   *
   * The GraphQLiteralEnumType requires the typeData arg because it
   * needs to synchronously return and therefore must check for / break
   * circular references when mixing.
   */
  buildType(builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType(this.typeConfig);
  }
}

export class GraphQLiteralUnionType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
> {
  protected typeConfig: Types.UnionTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      members: [],
      directives: [],
    };
  }

  mix<UnionTypeName extends string>(
    type: UnionTypeName,
    options?: Types.MixOpts<any>
  ) {
    this.typeConfig.members.push({
      item: Types.NodeType.MIX,
      typeName: type,
      mixOptions: options || {},
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
  resolveType(typeResolver: Types.TypeResolver<GenTypes, TypeName>) {
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Should be used very rarely, adds a directive directly to the
   * union definition - for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>) {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLUnionType {
    return builder.unionType(this.typeConfig);
  }
}

abstract class FieldsArgs<GenTypes = GraphQLiteralGen> {
  idArg(options?: Types.ArgOpts) {
    return arg("ID", options);
  }

  intArg(options?: Types.ArgOpts) {
    return arg("Int", options);
  }

  floatArg(options?: Types.ArgOpts) {
    return arg("Float", options);
  }

  booleanArg(options?: Types.ArgOpts) {
    return arg("Boolean", options);
  }

  stringArg(options?: Types.ArgOpts) {
    return arg("String", options);
  }

  fieldArg(type: Types.AllInputTypes<GenTypes>, options?: Types.ArgOpts) {
    return arg(type, options);
  }
}

export class GraphQLiteralObjectType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
> extends FieldsArgs<GenTypes> {
  /**
   * All metadata about the object type
   */
  protected typeConfig: Types.ObjectTypeConfig;

  constructor(readonly name: string) {
    super();
    this.typeConfig = {
      name,
      fields: [],
      interfaces: [],
      directives: [],
      fieldModifications: {},
    };
  }

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: Types.MixOpts<any>) {
    this.typeConfig.fields.push({
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
    type: Types.AllOutputTypes<GenTypes> | Types.BaseScalars,
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
    this.typeConfig.description = dedent(description);
  }

  /**
   * Adds an "isTypeOf" check to the object type.
   */
  isTypeOf(fn: (value: GraphQLIsTypeOfFn<any, any>) => boolean) {
    this.typeConfig.isTypeOf = fn;
  }

  /**
   * Used to modify a field already defined on an interface or
   * abstract type.
   *
   * At this point the type will not change, but the resolver,
   * default, property, or description fields can.
   */
  modify<FieldName extends Types.ObjectTypeFields<GenTypes, TypeName>>(
    field: FieldName,
    options: Types.ModifyFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.typeConfig.fieldModifications[field as string] = options;
  }

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
   * Should be used very rarely, adds a directive directly to the
   * object definition - for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>) {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Set the nullability config for the type
   */
  nullability(nullability: Types.NullabilityConfig) {
    if (this.typeConfig.nullability) {
      console.warn(
        `nullability has already been set for type ${
          this.typeConfig.name
        }, the previous value will be replaced`
      );
    }
    this.typeConfig.nullability = nullability;
  }

  /**
   * Sets the concrete "backing type" for this type, this can
   * be a simple object, a class, a database Model, whatever
   * you expect as the first argument to a resolver.
   *
   * It is highly recommended that you set this value for any types
   * that are non-transient. If none is provided, it will default
   * to the shape of the type.
   *
   * Note: This value can also be set when building the schema via
   * the "rootTypes" option to `GraphQLiteralSchema`
   */
  rootType(typeImport: string | Types.ImportedType) {
    this.typeConfig.rootType = typeImport;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder) {
    return builder.objectType(this.typeConfig);
  }
}

export class GraphQLiteralInterfaceType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.InterfaceTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      fields: [],
      directives: [],
    };
  }

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, mixOptions?: Types.MixOpts<any>) {
    this.typeConfig.fields.push({
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
    type: Types.AllOutputTypes<GenTypes> | Types.BaseScalars,
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
    this.typeConfig.description = dedent(description);
  }

  /**
   * Optionally provide a custom type resolver function. If one is not provided,
   * the default implementation will call `isTypeOf` on each implementing
   * Object type.
   */
  resolveType(typeResolver: Types.TypeResolver<GenTypes, TypeName>) {
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * Should be used very rarely, adds a directive directly to the
   * interface definition - for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>) {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Supply the default field resolver for all members of this interface
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
  buildType(builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType(this.typeConfig);
  }
}

export class GraphQLiteralInputObjectType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
> {
  protected typeConfig: Types.InputTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      fields: [],
      directives: [],
    };
  }

  /**
   * Add an ID field type to the object schema.
   */
  id(name: string, options?: Types.InputFieldOpts<GenTypes, "ID">) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int(name: string, options?: Types.InputFieldOpts<GenTypes, "Int">) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float(name: string, options?: Types.InputFieldOpts<GenTypes, "Float">) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string(name: string, options?: Types.InputFieldOpts<GenTypes, "String">) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean(name: string, options?: Types.InputFieldOpts<GenTypes, "Boolean">) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
    options?: Types.InputFieldOpts<GenTypes, TypeName>
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
    this.typeConfig.description = dedent(description);
  }

  /**
   * Should be used very rarely, adds a directive directly to the
   * input object definition - for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>) {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Set the nullability config for the type
   */
  nullability(nullability: Types.NullabilityConfig) {
    if (this.typeConfig.nullability) {
      console.warn(
        `nullability has already been set for type ${
          this.typeConfig.name
        }, the previous value will be replaced`
      );
    }
    this.typeConfig.nullability = nullability;
  }

  /**
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLInputObjectType {
    return builder.inputObjectType(this.typeConfig);
  }
}

export class GraphQLiteralDirectiveType<GenTypes = GraphQLiteralGen> {
  protected typeConfig: Types.DirectiveTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      locations: [],
      directiveArgs: [],
    };
  }

  description(description: string) {
    this.typeConfig.description = dedent(description);
  }

  locations(...location: DirectiveLocationEnum[]) {
    this.typeConfig.locations.push(...location);
  }

  /**
   * Add an ID field type to the object schema.
   */
  id(name: string, options?: Types.InputFieldOpts<GenTypes, "ID">) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int(name: string, options?: Types.InputFieldOpts<GenTypes, "Int">) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float(name: string, options?: Types.InputFieldOpts<GenTypes, "Float">) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string(name: string, options?: Types.InputFieldOpts<GenTypes, "String">) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean(name: string, options?: Types.InputFieldOpts<GenTypes, "Boolean">) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<TypeName extends Types.AllInputTypes<GenTypes> | Types.BaseScalars>(
    name: string,
    type: TypeName,
    options?: Types.InputFieldOpts<GenTypes, TypeName>
  ) {
    this.typeConfig.directiveArgs.push({
      name,
      type,
      ...options,
    });
  }

  buildType(builder: SchemaBuilder) {
    return builder.directiveType(this.typeConfig);
  }
}
