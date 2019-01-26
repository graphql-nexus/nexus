import * as Types from "./types";
import {
  GraphQLFieldResolver,
  GraphQLInputObjectType,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLObjectType,
  GraphQLFieldConfigMap,
  Thunk,
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
  interface NexusGen {}
}

/**
 * Contains methods shared between `objectType`, `extendType`, and `interfaceType`
 */
export abstract class AbstractOutputMethods<
  TypeName extends string,
  GenTypes = NexusGen
> {
  protected typeConfig: Types.OutputObjectConfig;

  constructor(readonly name: string) {
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
    ...opts: Types.ConditionalOutputFieldOpts<
      GenTypes,
      TypeName,
      FieldName,
      string
    >
  ) {
    this.field(name, "ID", ...opts);
  }

  /**
   * Add an Int field type to the object schema.
   */
  int<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<
      GenTypes,
      TypeName,
      FieldName,
      number
    >
  ) {
    this.field(name, "Int", ...opts);
  }

  /**
   * Add a Float field type to the object schema.
   */
  float<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<
      GenTypes,
      TypeName,
      FieldName,
      number
    >
  ) {
    this.field(name, "Float", ...opts);
  }

  /**
   * Add a String field type to the object schema.
   */
  string<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<
      GenTypes,
      TypeName,
      FieldName,
      string
    >
  ) {
    this.field(name, "String", ...opts);
  }

  /**
   * Add a Boolean field type to the object schema.
   */
  boolean<FieldName extends string>(
    name: FieldName,
    ...opts: Types.ConditionalOutputFieldOpts<
      GenTypes,
      TypeName,
      FieldName,
      boolean
    >
  ) {
    this.field(name, "Boolean", ...opts);
  }

  /**
   * Adds a new field to the object type
   */
  field<FieldName extends string>(
    name: FieldName,
    type:
      | Types.GetGen<GenTypes, "allOutputTypes">
      | Types.WrappedOutput
      | Types.BaseScalars,
    ...opts: Types.ConditionalOutputFieldOpts<GenTypes, TypeName, FieldName>
  ) {
    let options: Types.OutputFieldOpts<GenTypes, TypeName, any> = {};
    if (typeof opts[0] === "function") {
      options.resolve = opts[0];
    } else {
      options = { ...opts[0] };
    }
    this.typeConfig.fields.push({
      name,
      type,
      ...options,
    });
  }

  protected addField(name: string, type: any, ...opts: any[]) {
    let options: Types.OutputFieldOpts<GenTypes, TypeName, any> = {};
    if (typeof opts[0] === "function") {
      options.resolve = opts[0];
    } else {
      options = { ...opts[0] };
    }
    this.typeConfig.fields.push({
      name,
      type,
      ...options,
    });
  }
}

/**
 * Container object for defining the `GraphQLObjectType`
 */
export class ObjectTypeDef<
  TypeName extends string,
  GenTypes = NexusGen
> extends AbstractOutputMethods<TypeName, GenTypes> {
  /**
   * All metadata about the object type
   */
  protected typeConfig: Types.ObjectTypeConfig;

  constructor(readonly name: string) {
    super(name);
    this.typeConfig = {
      name,
      fields: [],
      mixed: [],
      interfaces: [],
      fieldModifications: {},
    };
  }

  /**
   * Mixes in an existing field definition or object type
   * with the current type.
   */
  mix(typeName: string, options: Types.MixOpts<any> = {}) {
    this.typeConfig.mixed.push({
      typeName,
      options,
    });
  }

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  implements(...interfaceName: Types.GetGen<GenTypes, "interfaceNames">[]) {
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
   * Used to modify a field already defined on an interface or mixed-in
   * from another type.
   *
   * At this point the type will not change, but the resolver,
   * default, property, or description fields can.
   */
  modify<
    FieldName extends Extract<
      keyof Types.GetGen2<GenTypes, "returnTypes", TypeName>,
      string
    >
  >(
    field: FieldName,
    options: Types.ModifyFieldOpts<GenTypes, TypeName, FieldName, any>
  ): void {
    this.typeConfig.fieldModifications[field as string] = options;
  }

  /**
   * Supply the default field resolver for all members of this type
   */
  defaultResolver(
    resolverFn: GraphQLFieldResolver<
      Types.RootValue<GenTypes, TypeName>,
      Types.GetGen<GenTypes, "context">
    >
  ): void {
    this.typeConfig.defaultResolver = resolverFn;
  }

  /**
   * Configures the nullability for the type, check the
   * documentation's "Getting Started" section to learn
   * more about GraphQL Nexus's assumptions and configuration
   * on nullability.
   */
  nullability(config: Types.NullabilityConfig): void {
    if (this.typeConfig.nullability) {
      console.warn(
        `nullability has already been set for type ${
          this.typeConfig.name
        }, the previous value will be replaced`
      );
    }
    this.typeConfig.nullability = config;
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
export class EnumTypeDef<GenTypes = NexusGen> {
  protected typeConfig: Types.EnumTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      members: [],
      mixed: [],
    };
  }

  mix<EnumName extends Types.GetGen<GenTypes, "enumNames">>(
    typeName: EnumName,
    options: Types.MixOpts<Types.EnumMembers<GenTypes, EnumName>> = {}
  ) {
    this.typeConfig.mixed.push({
      typeName,
      options,
    });
  }

  member(name: string, config: Types.EnumMemberConfig = {}) {
    this.typeConfig.members.push({
      name,
      value: name,
      ...config,
    });
  }

  /**
   * Sets the members of the enum
   */
  members(info: Array<Types.EnumMemberInfo | string>) {
    info.forEach((member) => {
      if (typeof member === "string") {
        return this.typeConfig.members.push({
          name: member,
          value: member,
        });
      }
      this.typeConfig.members.push(member);
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLEnumType {
    return builder.enumType(this.typeConfig);
  }
}

/**
 * Configure the `GraphQLUnionType` definition
 */
export class UnionTypeDef<TypeName extends string, GenTypes = NexusGen> {
  protected typeConfig: Types.UnionTypeConfig;

  constructor(readonly name: TypeName) {
    this.typeConfig = {
      name,
      mixed: [],
      members: [],
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
    typeName: UnionTypeName,
    options: Types.MixOmitOpts<any> = {}
  ) {
    this.typeConfig.mixed.push({
      typeName,
      options,
    });
  }

  /**
   * Add one or more members to the GraphQLUnion. Any types provided should be valid
   * object types available to the schema.
   */
  members(...types: Array<Types.GetGen<GenTypes, "objectNames">>) {
    types.forEach((typeName) => {
      this.typeConfig.members.push(typeName);
    });
  }

  /**
   * Define a type resolver function for the union type. The Resolver should
   * return the type name of the union member that should be fulfilled.
   *
   * @see https://github.com/graphql/graphql-js/issues/876#issuecomment-304398882
   */
  resolveType(typeResolver: Types.TypeResolver<GenTypes, TypeName>) {
    this.typeConfig.resolveType = typeResolver;
  }

  /**
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLUnionType {
    return builder.unionType(this.typeConfig);
  }
}

/**
 * Container for the `GraphQLInterfaceType` definition
 */
export class InterfaceTypeDef<
  TypeName extends string,
  GenTypes = NexusGen
> extends AbstractOutputMethods<TypeName, GenTypes> {
  /**
   * Metadata about the object type
   */
  protected typeConfig: Types.InterfaceTypeConfig;

  constructor(readonly name: string) {
    super(name);
    this.typeConfig = {
      name,
      fields: [],
      mixed: [],
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
    type: Types.GetGen<GenTypes, "allOutputTypes"> | Types.BaseScalars,
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
   * @internal
   */
  buildType(builder: SchemaBuilder): GraphQLInterfaceType {
    return builder.interfaceType(this.typeConfig);
  }
}

export class InputObjectTypeDef<TypeName extends string, GenTypes = NexusGen> {
  protected typeConfig: Types.InputTypeConfig;

  constructor(readonly name: string) {
    this.typeConfig = {
      name,
      fields: [],
      mixed: [],
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
  field(
    name: string,
    type: Types.GetGen<GenTypes, "inputNames"> | Types.BaseScalars,
    options?: Types.InputFieldOpts<GenTypes, TypeName>
  ) {
    this.typeConfig.fields.push({
      name,
      type,
      ...options,
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

/**
 * Provided to the `extendType` function, the ExtendTypeDef
 * is a container for all metadata about the type we're extending.
 */
export class ExtendTypeDef<
  TypeName extends string,
  GenTypes = NexusGen
> extends AbstractOutputMethods<TypeName, GenTypes> {
  /**
   * All metadata about the object type
   */
  protected typeConfig: Types.ExtendTypeConfig;

  constructor(readonly name: string) {
    super(name);
    this.typeConfig = {
      name,
      fields: [],
      interfaces: [],
    };
  }

  /**
   * Declare that an object type implements a particular interface,
   * by providing the name of the interface
   */
  field<
    TypeName extends Types.GetGen<GenTypes, "inputNames"> | Types.BaseScalars
  >(
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
  buildType(builder: SchemaBuilder): Thunk<GraphQLFieldConfigMap<any, any>> {
    return builder.extendType(this.typeConfig);
  }
}

/**
 * The `WrappedType` exists to signify that the value returned from
 * the type construction APIs should not be used externally outside of the
 * builder function. It also is useful if you need the SchemaBuilder, in that
 * it can take a function which is lazy-evaluated to build the type.
 */
export class WrappedType<T extends Types.Wrappable = any> {
  constructor(readonly type: T | ((schema: SchemaBuilder) => T)) {}
}
