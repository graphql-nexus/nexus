import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLIsTypeOfFn,
  GraphQLResolveInfo,
  DirectiveLocationEnum,
  assertValidName,
} from "graphql";
import { addMix, dedent } from "./utils";
import { SchemaBuilder } from "./builder";
import { GQLiteralArg } from "./definitions";

declare global {
  interface GQLiteralGen {}
}

export type GQLiteralNamedType =
  | GQLiteralEnumType<any>
  | GQLiteralObjectType<any, any>
  | GQLiteralInterfaceType<any, any>
  | GQLiteralUnionType<any, any>
  | GQLiteralInputObjectType<any>;

/**
 * Backing type for an enum member.
 */
export class GQLiteralEnumType<GenTypes = GQLiteralGen> {
  protected typeConfig: Types.EnumTypeConfig;

  constructor(name: string) {
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
   * The GQLiteralEnumType requires the typeData arg because it
   * needs to synchronously return and therefore must check for / break
   * circular references when mixing.
   */
  buildType(builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType(this.typeConfig);
  }
}

export class GQLiteralUnionType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> {
  protected typeConfig: Types.UnionTypeConfig;

  constructor(name: string) {
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

abstract class FieldsArgs<GenTypes = GQLiteralGen> {
  idArg(options?: Types.ArgOpts) {
    return GQLiteralArg("ID", options);
  }

  intArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Int", options);
  }

  floatArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Float", options);
  }

  booleanArg(options?: Types.ArgOpts) {
    return GQLiteralArg("Boolean", options);
  }

  stringArg(options?: Types.ArgOpts) {
    return GQLiteralArg("String", options);
  }

  fieldArg(type: Types.AllInputTypes<GenTypes>, options?: Types.ArgOpts) {
    return GQLiteralArg(type, options);
  }
}

export class GQLiteralObjectType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> extends FieldsArgs<GenTypes> {
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
      directives: [],
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
    return {
      resolver(
        fn: (
          root: Types.RootValue<GenTypes, TypeName>,
          args: Types.ArgsValue<GenTypes, TypeName, FieldName>,
          context: Types.ContextValue<GenTypes>,
          info: GraphQLResolveInfo
        ) => Types.ResultValue<GenTypes, TypeName, FieldName>
      ): void {},
    };
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
    options?: Types.ModifyFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    throw new Error("TODO");
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
   * the "backingTypes" option to `GQLiteralSchema`
   */
  backingType(typeImport: Types.ImportedType) {
    this.typeConfig.backingType = typeImport;
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
  GenTypes = GQLiteralGen,
  TypeName extends string = any
> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.InterfaceTypeConfig;

  constructor(name: string) {
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
   * Internal use only. Creates the configuration to create
   * the GraphQL named type.
   */
  buildType(builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType(this.typeConfig);
  }
}

export class GQLiteralInputObjectType<GenTypes = GQLiteralGen> {
  protected typeConfig: Types.InputTypeConfig;

  constructor(name: string) {
    this.typeConfig = {
      name,
      fields: [],
      directives: [],
    };
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
    options?: Types.InputFieldOpts
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
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
    options?: Types.AbstractFieldOpts<GenTypes, FieldName>
  ) {
    this.typeConfig.fields.push({
      name: assertValidName(name),
      type,
      ...options,
    });
  }

  buildType(): Types.AbstractTypeConfig {
    return this.typeConfig;
  }
}

export class GQLiteralDirectiveType<GenTypes = GQLiteralGen> {
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
  id<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "ID", options);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Int", options);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Float", options);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "String", options);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    options?: Types.InputFieldOpts
  ) {
    this.field(name, "Boolean", options);
  }

  /**
   * Adds a new field to the input object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
    options?: Types.InputFieldOpts
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
