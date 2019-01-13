import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLIsTypeOfFn,
  DirectiveLocationEnum,
  GraphQLObjectType,
  GraphQLDirective,
  GraphQLScalarType,
} from "graphql";
import { dedent } from "./utils";
import { SchemaBuilder, isNamedTypeDef } from "./builder";
import { Metadata } from "./metadata";

export { SDLConverter } from "./sdlConverter";

// Export the ts definitions so they can be used by library authors under `core.Types`
export { Types };

// Same as above, export all core things under the "core" namespace
export { SchemaBuilder, isNamedTypeDef, Metadata };

// Keeping this in core since it shouldn't be needed directly
export { typegenAutoConfig } from "./autoConfig";

declare global {
  interface GraphQLNexusGen {}
}

/**
 * Provided to the [objectType](#objectType) function, this
 */
export class ObjectTypeDef<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
> {
  /**
   * All metadata about the object type
   */
  protected typeConfig: Types.ObjectTypeConfig;

  constructor(readonly name: string) {
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
  mix(typeName: string, options?: Types.MixOpts<any>) {
    this.typeConfig.fields.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: options || {},
    });
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "ID", ...opts);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Int", ...opts);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Float", ...opts);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "String", ...opts);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Boolean", ...opts);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllOutputTypes<GenTypes> | Types.BaseScalars,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    let options: Types.OutputFieldOpts<GenTypes, TypeName, any> = {};
    if (typeof opts[0] === "function") {
      options.resolve = opts[0];
    } else {
      options = { ...opts[0] };
    }
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
   * Adds a description to the `GraphQLObjectType`
   *
   * Descriptions will be output as type annotations in the generated SDL
   */
  description(description: string) {
    this.typeConfig.description = dedent(description);
  }

  /**
   * Adds an "isTypeOf" check to the object type.
   */
  isTypeOf(fn: (value: GraphQLIsTypeOfFn<any, any>) => boolean): void {
    this.typeConfig.isTypeOf = fn;
  }

  /**
   * Used to modify a field already defined on an interface or mixed-in
   * from another type.
   *
   * At this point the type will not change, but the resolver,
   * default, property, or description fields can.
   */
  modify<FieldName extends Types.ObjectTypeFields<GenTypes, TypeName>>(
    field: FieldName,
    options: Types.ModifyFieldOpts<GenTypes, TypeName, FieldName>
  ): void {
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
  ): void {
    this.typeConfig.defaultResolver = resolverFn;
  }

  /**
   * Adds a directive directly to the object definition
   *
   * > Should be used rarely, typically only for interpretation by other schema consumers.
   */
  directive(name: string, args?: Record<string, any>): void {
    this.typeConfig.directives.push({
      name,
      args: args || {},
    });
  }

  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   *
   * @param nullability
   */
  nullability(nullability: Types.NullabilityConfig): void {
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLObjectType {
    return builder.objectType(this.typeConfig);
  }
}

/**
 * Backing type for an enum member.
 */
export class EnumTypeDef<GenTypes = GraphQLNexusGen> {
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
    options?: Types.MixOpts<Types.EnumMembers<GenTypes, EnumName>>
  ) {
    this.typeConfig.members.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: options || {},
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
   * Adds a description to the `GraphQLEnumType`
   *
   * Descriptions will be output as type annotations in the generated SDL
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType(this.typeConfig);
  }
}

/**
 * Configure the `GraphQLUnionType` definition
 */
export class UnionTypeDef<
  GenTypes = GraphQLNexusGen,
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

  /**
   * Take an existing union and base the type off of that, using the `omit`
   * option to exclude members of the other union.
   *
   * > Note: Circular dependencies between unions are not allowed and will
   * trigger an error at build-time.
   */
  mix<UnionTypeName extends string>(
    type: UnionTypeName,
    options?: Types.MixOmitOpts<any>
  ) {
    this.typeConfig.members.push({
      item: Types.NodeType.MIX,
      typeName: type,
      mixOptions: options || {},
    });
  }

  /**
   * Add one or more members to the GraphQLUnion. Any types provided should be valid
   * object types available to the schema.
   */
  members(...types: Array<Types.ObjectNames<GenTypes>>) {
    types.forEach((typeName) => {
      this.typeConfig.members.push({
        item: Types.NodeType.UNION_MEMBER,
        typeName,
      });
    });
  }

  /**
   * Define a type resolver function for the union type. The Resolver should
   * return the type name of the union member that should be fulfilled.
   *
   * > Providing this is highly recommended. If one is not provided, the
   * default implementation will call `isTypeOf` on each implementing Object type.
   *
   * @see https://github.com/graphql/graphql-js/issues/876#issuecomment-304398882
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLUnionType {
    return builder.unionType(this.typeConfig);
  }
}

export class InterfaceTypeDef<
  GenTypes = GraphQLNexusGen,
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
  mix(typeName: string, options?: Types.MixOpts<any>) {
    this.typeConfig.fields.push({
      item: Types.NodeType.MIX,
      typeName,
      mixOptions: options || {},
    });
  }

  /**
   * Add an ID field type to the object schema.
   */
  id<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "ID", ...opts);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Int", ...opts);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Float", ...opts);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "String", ...opts);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    this.field(name, "Boolean", ...opts);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type: Types.AllOutputTypes<GenTypes> | Types.BaseScalars,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    let options: Types.OutputFieldOpts<GenTypes, TypeName, any> = {};
    if (typeof opts[0] === "function") {
      options.resolve = opts[0];
    } else {
      options = { ...opts[0] };
    }
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
   * Adds a description to the `GraphQLInterfaceType`
   *
   * Descriptions will be output as type annotations in the generated SDL
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType(this.typeConfig);
  }
}

export class InputObjectTypeDef<
  GenTypes = GraphQLNexusGen,
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

  /**
   * Adds a description to the `GraphQLInputObjectType`
   *
   * Descriptions will be output as type annotations in the generated SDL
   */
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
   * Configures the nullability for the type
   *
   * @see nullability
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLInputObjectType {
    return builder.inputObjectType(this.typeConfig);
  }
}

export class DirectiveTypeDef<GenTypes = GraphQLNexusGen> {
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

  /**
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLDirective {
    return builder.directiveType(this.typeConfig);
  }
}

/**
 * The `WrappedType` exists to signify that the value returned from
 * the type construction APIs should not be used externally outside of the
 * builder function. It also is useful if you need the SchemaBuilder, in that
 * it can take a function which is lazy-evaluated to build the type.
 */
export class WrappedType {
  constructor(
    readonly type:
      | Types.NamedTypeDef
      | DirectiveTypeDef
      | GraphQLScalarType
      | ((schema: SchemaBuilder) => WrappedType)
  ) {}
}
