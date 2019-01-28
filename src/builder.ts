import {
  defaultFieldResolver,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLFieldResolver,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLString,
  GraphQLUnionType,
  isEnumType,
  isInputType,
  isInterfaceType,
  isNamedType,
  isObjectType,
  isOutputType,
  isUnionType,
  GraphQLSchema,
  Thunk,
} from "graphql";
import { Metadata } from "./metadata";
// import { WrappedType } from "./core";
import * as Types from "./typegenTypeHelpers";
import { suggestionList, objValues } from "./utils";
import { isObject } from "util";
import { TypegenAutoConfigOptions } from "./typegenAutoConfig";
import { FormatTypegenFn } from "./prettierFormat";
import { GetGen } from "./typegenTypeHelpers";
import { NullabilityConfig, Omit } from "./definitions/_types";
import { InterfaceTypeDef } from "./definitions/interfaceType";
import { InputObjectTypeDef } from "./definitions/inputObjectType";
import { ObjectTypeDef } from "./definitions/objectType";
import { UnionTypeDef } from "./definitions/unionType";
import { ExtendTypeDef } from "./definitions/extendType";
import { EnumTypeDef } from "./definitions/enumType";
import { InputFieldDef, OutputFieldDef } from "./definitions/blocks";
import { ArgDef } from "./definitions/args";

const isPromise = (val: any): val is Promise<any> =>
  Boolean(val && typeof val.then === "function");

const NULL_DEFAULTS = {
  output: false,
  input: true,
};

const SCALARS: Record<string, GraphQLScalarType> = {
  String: GraphQLString,
  Int: GraphQLInt,
  Float: GraphQLFloat,
  ID: GraphQLID,
  Boolean: GraphQLBoolean,
};

export interface BuilderConfig<GenTypes = NexusGen> {
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
   * Automatically configure type resolution for the TypeScript
   * representations of the associated types.
   *
   * Alias for typegenConfig: typegenAutoConfig(options)
   */
  typegenAutoConfig?: TypegenAutoConfigOptions;
  /**
   * A configuration function for advanced cases where
   * more control over the `TypegenInfo` is needed.
   */
  typegenConfig?: (
    schema: GraphQLSchema,
    outputPath: string
  ) => TypegenInfo<GenTypes> | PromiseLike<TypegenInfo<GenTypes>>;
  /**
   * Either an absolute path to a .prettierrc file, or an object
   * with relevant Prettier rules to be used on the generated output
   */
  prettierConfig?: string | object;
  /**
   * Manually apply a formatter to the generated content before saving,
   * see the `prettierConfig` option if you want to use Prettier.
   */
  formatTypegen?: FormatTypegenFn;
  /**
   * Configures the default "nullability" for the entire schema the type.
   * Read more about how nexus handles nullability:
   *
   * @link {}
   */
  nullability?: NullabilityConfig;
}

export interface TypegenInfo<GenTypes = NexusGen> {
  /**
   * Headers attached to the generate type output
   */
  headers: string[];
  /**
   * All imports for the backing types / context
   */
  imports: string[];
  /**
   * A map of all GraphQL types and what TypeScript types they should
   * be represented by.
   */
  backingTypeMap: { [K in GetGen<GenTypes, "objectNames">]?: string };
  /**
   * The type of the context for the resolvers
   */
  contextType?: string;
}

export interface SchemaConfig extends BuilderConfig {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
}

/**
 * Builds all of the types, properly accounts for any using "mix".
 * Since the enum types are resolved synchronously, these need to guard for
 * circular references at this step, while fields will guard for it during lazy evaluation.
 */
export class SchemaBuilder {
  /**
   * Used to check for circular references.
   */
  protected buildingTypes = new Set();
  /**
   * The "final type" map contains all types as they are built.
   */
  protected finalTypeMap: Record<string, GraphQLNamedType> = {};
  /**
   * The "defined type" map keeps track of all of the types that were
   * defined directly as `GraphQL*Type` objects, so we don't accidentally
   * overwrite any.
   */
  protected definedTypeMap: Record<string, GraphQLNamedType> = {};
  /**
   * The "pending type" map keeps track of all types that were defined w/
   * GraphQL Nexus and haven't been processed into concrete types yet.
   */
  protected pendingTypeMap: Record<string, Types.NamedTypeDef> = {};

  /**
   * Configure the root-level nullability defaults
   */
  protected nullability: NullabilityConfig = {};

  constructor(protected metadata: Metadata, protected config: BuilderConfig) {
    this.nullability = config.nullability || {};
  }

  getConfig(): BuilderConfig {
    return this.config;
  }

  addType(typeDef: Types.NamedTypeDef | GraphQLNamedType) {
    const existingType =
      this.finalTypeMap[typeDef.name] || this.pendingTypeMap[typeDef.name];
    if (existingType) {
      // Allow importing the same exact type more than once.
      if (existingType === typeDef) {
        return;
      }
      throw extendError(typeDef.name);
    }
    if (isNamedType(typeDef)) {
      this.metadata.addExternalType(typeDef);
      this.finalTypeMap[typeDef.name] = typeDef;
      this.definedTypeMap[typeDef.name] = typeDef;
    } else {
      this.pendingTypeMap[typeDef.name] = typeDef;
    }
  }

  getFinalTypeMap(): BuildTypes<any, any> {
    Object.keys(this.pendingTypeMap).forEach((key) => {
      // If we've already constructed the type by this point,
      // via circular dependency resolution don't worry about building it.
      if (this.finalTypeMap[key]) {
        return;
      }
      if (this.definedTypeMap[key]) {
        throw extendError(key);
      }
      this.finalTypeMap[key] = this.getOrBuildType(key);
      this.buildingTypes.clear();
    });
    return {
      typeMap: this.finalTypeMap,
      metadata: this.metadata,
    };
  }

  inputObjectType(config: InputObjectTypeDef): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
      name: config.name,
      fields: () => this.buildInputObjectFields(config),
      description: config.description,
    });
  }

  extendType(config: ExtendTypeDef): Thunk<GraphQLFieldConfigMap<any, any>> {
    return () => {
      return {};
    };
  }

  objectType(config: ObjectTypeDef) {
    return new GraphQLObjectType({
      name: config.name,
      interfaces: () => config.interfaces.map((i) => this.getInterface(i)),
      description: config.description,
      fields: () => {
        const interfaceFieldsMap: GraphQLFieldConfigMap<any, any> = {};
        const allInterfaces = config.interfaces.map((i) =>
          this.getInterface(i)
        );
        allInterfaces.forEach((i) => {
          const interfaceFields = i.getFields();
          // We need to take the interface fields and reconstruct them
          // this actually simplifies things becuase if we've modified
          // the field at all it needs to happen here.
          Object.keys(interfaceFields).forEach((iFieldName) => {
            const { isDeprecated, args, ...rest } = interfaceFields[iFieldName];
            interfaceFieldsMap[iFieldName] = {
              ...rest,
              args: args.reduce(
                (result: GraphQLFieldConfigArgumentMap, arg) => {
                  const { name, ...argRest } = arg;
                  result[name] = argRest;
                  return result;
                },
                {}
              ),
            };
          });
        });
        return {
          ...interfaceFieldsMap,
          ...this.buildObjectFields(config),
        };
      },
    });
  }

  interfaceType(config: InterfaceTypeDef) {
    const { name, resolveType, description } = config;
    return new GraphQLInterfaceType({
      name,
      fields: () => this.buildObjectFields(config),
      resolveType,
      description,
    });
  }

  enumType(config: EnumTypeDef) {
    return new GraphQLEnumType({
      name: config.name,
      values: this.buildEnumMembers(config),
    });
  }

  unionType(config: UnionTypeDef) {
    return new GraphQLUnionType({
      name: config.name,
      resolveType: config.resolveType,
      types: () => this.buildUnionMembers(config),
    });
  }

  protected missingType(typeName: string): GraphQLNamedType {
    const suggestions = suggestionList(
      typeName,
      Object.keys(this.buildingTypes).concat(Object.keys(this.finalTypeMap))
    );
    let suggestionsString = "";
    if (suggestions.length > 0) {
      suggestionsString = ` or mean ${suggestions.join(", ")}`;
    }
    throw new Error(
      `Missing type ${typeName}, did you forget to import a type${suggestionsString}?`
    );
  }

  protected buildEnumMembers(config: EnumTypeDef) {
    let values: GraphQLEnumValueConfigMap = {};
    config.members.forEach((member) => {
      values[member.name] = {
        value: member.value,
        description: member.description,
      };
    });
    if (!Object.keys(values).length) {
      throw new Error(
        `GraphQL Nexus: Enum ${config.name} must have at least one member`
      );
    }
    return values;
  }

  protected buildUnionMembers(config: UnionTypeDef) {
    const unionMembers: GraphQLObjectType[] = [];
    config.members.forEach((member) => {
      unionMembers.push(this.getObjectType(member));
    });
    if (!unionMembers.length) {
      throw new Error(
        `GraphQL Nexus: Union ${config.name} must have at least one member type`
      );
    }
    return unionMembers;
  }

  protected buildObjectFields(
    typeConfig: ObjectTypeDef | InterfaceTypeDef
  ): GraphQLFieldConfigMap<any, any> {
    const fieldMap: GraphQLFieldConfigMap<any, any> = {};
    typeConfig.fields.forEach((field) => {
      fieldMap[field.name] = this.buildObjectField(field, typeConfig);
    });
    return fieldMap;
  }

  protected buildInputObjectFields(
    typeConfig: InputObjectTypeDef
  ): GraphQLInputFieldConfigMap {
    const fieldMap: GraphQLInputFieldConfigMap = {};
    typeConfig.fields.forEach((field) => {
      fieldMap[field.name] = this.buildInputObjectField(field, typeConfig);
    });
    return fieldMap;
  }

  protected buildObjectField(
    fieldConfig: OutputFieldDef,
    typeConfig: ObjectTypeDef | InterfaceTypeDef
  ): GraphQLFieldConfig<any, any> {
    this.metadata.addField(typeConfig.name, fieldConfig);
    return {
      type: this.decorateOutputType(
        this.getOutputType(fieldConfig.type),
        fieldConfig,
        typeConfig
      ),
      args: this.buildArgs(fieldConfig.args || {}, typeConfig),
      resolve: this.getResolver(fieldConfig, typeConfig),
      description: fieldConfig.description,
      // TODO: Need to look into subscription semantics and how
      // resolution works for them.
      // subscribe: fieldConfig.subscribe,
      // deprecationReason?: Maybe<string>;
    };
  }

  protected buildInputObjectField(
    field: InputFieldDef,
    typeConfig: InputObjectTypeDef
  ): GraphQLInputFieldConfig {
    return {
      type: this.decorateInputType(
        this.getInputType(field.type),
        field,
        typeConfig
      ),
    };
  }

  protected buildArgs(
    args: Record<string, ArgDef>,
    typeConfig: ObjectTypeDef | InterfaceTypeDef
  ): GraphQLFieldConfigArgumentMap {
    const allArgs: GraphQLFieldConfigArgumentMap = {};
    Object.keys(args).forEach((argName) => {
      const argDef = args[argName];
      allArgs[argName] = {
        type: this.decorateArgType(
          this.getInputType(argDef.type),
          { ...argDef, name: argName },
          typeConfig
        ),
        description: argDef.description,
      };
    });
    return allArgs;
  }

  protected decorateInputType(
    type: GraphQLInputType,
    fieldConfig: InputFieldDef,
    typeConfig: InputObjectTypeDef
  ) {
    const { required: _required, ...rest } = fieldConfig;
    const newOpts = rest;
    if (typeof _required !== "undefined") {
      newOpts.nullable = !_required;
    }
    return this.decorateType(type, newOpts, typeConfig, true);
  }

  protected decorateOutputType(
    type: GraphQLOutputType,
    fieldConfig: OutputFieldDef,
    typeConfig: ObjectTypeDef | InterfaceTypeDef
  ) {
    return this.decorateType(type, fieldConfig, typeConfig, false);
  }

  protected decorateArgType(
    type: GraphQLInputType,
    argOpts: ArgDef & { name: string },
    typeConfig: InputObjectTypeDef
  ) {
    const { required: _required, ...rest } = argOpts;
    const newOpts = rest;
    if (typeof _required !== "undefined") {
      newOpts.nullable = !_required;
    }
    return this.decorateType(type, newOpts, typeConfig, true);
  }

  /**
   * Adds the null / list configuration to the type.
   */
  protected decorateType(
    type: GraphQLOutputType,
    fieldConfig: Omit<Types.FieldDef, "type" | "default">,
    typeConfig: ObjectTypeDef | InterfaceTypeDef,
    isInput: false
  ): GraphQLOutputType;
  protected decorateType(
    type: GraphQLInputType,
    fieldConfig: Omit<Types.FieldDef, "type" | "default">,
    typeConfig: InputObjectTypeDef,
    isInput: true
  ): GraphQLInputType;
  protected decorateType(
    type: any,
    fieldConfig: Omit<Types.FieldDef, "type" | "default">,
    typeConfig: ObjectTypeDef | InterfaceTypeDef | InputObjectTypeDef,
    isInput: boolean
  ): any {
    let finalType = type;
    const nullConfig: typeof NULL_DEFAULTS = {
      ...NULL_DEFAULTS,
      ...this.nullability,
      ...typeConfig.nullability,
    };
    const { list, nullable } = fieldConfig;
    const isNullable =
      typeof nullable !== "undefined"
        ? nullable
        : list
        ? isInput
          ? nullConfig.inputList
          : nullConfig.outputList
        : isInput
        ? nullConfig.input
        : nullConfig.output;

    if (list) {
      const depth = listDepth || 1;
      const nullableItem =
        typeof listItemNullable !== "undefined"
          ? listItemNullable
          : isInput
          ? nullConfig.inputListItem
          : nullConfig.outputListItem;
      if (Array.isArray(nullableItem) && nullableItem.length !== depth) {
        throw new Error(
          `Incorrect listItemNullable array length for ${typeConfig.name}${
            fieldConfig.name
          }, expected ${depth} saw ${nullableItem.length}`
        );
      }
      for (let i = 0; i < depth; i++) {
        const isNull = Array.isArray(nullableItem)
          ? nullableItem[i]
          : nullableItem;
        if (!isNull) {
          finalType = GraphQLNonNull(finalType);
        }
        finalType = GraphQLList(finalType);
      }
    } else if (typeof listItemNullable !== "undefined") {
      console.log(
        "listItemNullable should only be set with list: true, this option is ignored"
      );
    }
    if (!isNullable) {
      return GraphQLNonNull(finalType);
    }
    return finalType;
  }

  protected getInterface(name: string): GraphQLInterfaceType {
    const type = this.getOrBuildType(name);
    if (!isInterfaceType(type)) {
      throw new Error(
        `Expected ${name} to be an interfaceType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getEnum(name: string): GraphQLEnumType {
    const type = this.getOrBuildType(name);
    if (!isEnumType(type)) {
      throw new Error(
        `Expected ${name} to be an enumType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getUnion(name: string): GraphQLUnionType {
    const type = this.getOrBuildType(name);
    if (!isUnionType(type)) {
      throw new Error(
        `Expected ${name} to be a unionType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getInputType(name: string) {
    const type = this.getOrBuildType(name);
    if (!isInputType(type)) {
      throw new Error(
        `Expected ${name} to be a valid input type, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getOutputType(name: string) {
    const type = this.getOrBuildType(name);
    if (!isOutputType(type)) {
      throw new Error(
        `Expected ${name} to be a valid output type, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getObjectType(name: string) {
    const type = this.getOrBuildType(name);
    if (!isObjectType(type)) {
      throw new Error(
        `Expected ${name} to be a objectType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getOrBuildType(name: string): GraphQLNamedType {
    if (SCALARS[name]) {
      return SCALARS[name];
    }
    if (this.finalTypeMap[name]) {
      return this.finalTypeMap[name];
    }
    if (this.buildingTypes.has(name)) {
      throw new Error(
        `GraphQL Nexus: Circular dependency detected, while building types ${Array.from(
          this.buildingTypes
        )}`
      );
    }
    const pendingType = this.pendingTypeMap[name];
    if (pendingType) {
      this.buildingTypes.add(name);
      return pendingType.buildType(this);
    }
    return this.missingType(name);
  }

  protected getResolver(
    fieldOptions: OutputFieldDef,
    typeConfig: ObjectTypeDef | InterfaceTypeDef
  ) {
    let resolver = typeConfig.defaultResolver || defaultFieldResolver;
    if (fieldOptions.resolve) {
      resolver = fieldOptions.resolve;
    }
    if (typeof fieldOptions.default !== "undefined") {
      resolver = withDefaultValue(resolver, fieldOptions.default);
    }
    return resolver;
  }
}

function withDefaultValue(
  resolver: GraphQLFieldResolver<any, any>,
  defaultValue: any
): GraphQLFieldResolver<any, any> {
  return (root, args, ctx, info) => {
    const result = resolver(root, args, ctx, info);
    if (typeof result === "undefined" || result === null) {
      return typeof defaultValue === "function" ? defaultValue() : defaultValue;
    }
    if (isPromise(result)) {
      return result.then((val: any) => {
        if (typeof val === "undefined" || val === null) {
          return typeof defaultValue === "function"
            ? defaultValue()
            : defaultValue;
        }
        return val;
      });
    }
    return result;
  };
}

function extendError(name: string) {
  return new Error(
    `${name} was already defined as a type, check the docs for extending`
  );
}

export interface BuildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType>
> {
  typeMap: TypeMapDefs;
  metadata: Metadata;
}

/**
 * Builds the types, normalizing the "types" passed into the schema for a
 * better developer experience. This is primarily useful for testing
 * type generation
 */
export function buildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType> = any
>(
  types: any,
  config: BuilderConfig = { outputs: false },
  SchemaBuilderClass: typeof SchemaBuilder = SchemaBuilder,
  MetadataClass: typeof Metadata = Metadata
): BuildTypes<TypeMapDefs> {
  const metadata = new MetadataClass(config);
  const builder = new SchemaBuilderClass(metadata, config);
  addTypes(builder, types);
  return builder.getFinalTypeMap();
}

function addTypes(builder: SchemaBuilder, types: any) {
  if (!types) {
    return;
  }
  if (isNexusTypeDef(types)) {
    types = types.type;
    if (typeof types === "function") {
      addTypes(builder, types(builder));
      return;
    }
  }
  if (isNamedTypeDef(types) || isNamedType(types)) {
    builder.addType(types);
  } else if (Array.isArray(types)) {
    types.forEach((typeDef) => addTypes(builder, typeDef));
  } else if (isObject(types)) {
    Object.keys(types).forEach((key) => addTypes(builder, types[key]));
  }
}

/**
 * Builds the schema, returning both the schema and metadata.
 */
export function makeSchemaWithMetadata(
  options: SchemaConfig,
  SchemaBuilderClass: typeof SchemaBuilder = SchemaBuilder,
  MetadataClass: typeof Metadata = Metadata
): { metadata: Metadata; schema: GraphQLSchema } {
  const { typeMap: typeMap, metadata } = buildTypes(
    options.types,
    options,
    SchemaBuilderClass,
    MetadataClass
  );
  let { Query, Mutation, Subscription } = typeMap;

  if (!Query) {
    console.warn(
      "Nexus: You should define a root `Query` type for your schema"
    );
    Query = new GraphQLObjectType({
      name: "Query",
      fields: {
        ok: {
          type: GraphQLNonNull(GraphQLBoolean),
          resolve: () => true,
        },
      },
    });
  }

  if (!isObjectType(Query)) {
    throw new Error(
      `Expected Query to be a objectType, saw ${Query.constructor.name}`
    );
  }
  if (Mutation && !isObjectType(Mutation)) {
    throw new Error(
      `Expected Mutation to be a objectType, saw ${Mutation.constructor.name}`
    );
  }
  if (Subscription && !isObjectType(Subscription)) {
    throw new Error(
      `Expected Subscription to be a objectType, saw ${
        Subscription.constructor.name
      }`
    );
  }

  const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
    types: objValues(typeMap),
  });

  metadata.finishConstruction();

  return { schema, metadata };
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GraphQL Nexus layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function makeSchema(options: SchemaConfig): GraphQLSchema {
  const { schema, metadata } = makeSchemaWithMetadata(options);

  // Only in development envs do we want to worry about regenerating the
  // schema definition and/or generated types.
  const {
    shouldGenerateArtifacts = process.env.NODE_ENV !== "production",
  } = options;

  if (shouldGenerateArtifacts) {
    // Generating in the next tick allows us to use the schema
    // in the optional thunk for the typegen config
    metadata.generateArtifacts(schema);
  }

  return schema;
}

export function isNexusTypeDef(obj: any): obj is WrappedType {
  return obj instanceof WrappedType;
}

export function isNamedTypeDef(obj: any): obj is Types.NamedTypeDef {
  return (
    obj instanceof ObjectTypeDef ||
    obj instanceof InputObjectTypeDef ||
    obj instanceof EnumTypeDef ||
    obj instanceof UnionTypeDef ||
    obj instanceof InterfaceTypeDef
  );
}
