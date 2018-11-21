import {
  defaultFieldResolver,
  GraphQLBoolean,
  GraphQLDirective,
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
  isDirective,
  isEnumType,
  isInputType,
  isInterfaceType,
  isNamedType,
  isObjectType,
  isOutputType,
  isUnionType,
  GraphQLSchema,
} from "graphql";
import { GQLiteralMetadata } from "./metadata";
import {
  GQLiteralAbstractType,
  GQLiteralDirectiveType,
  GQLiteralObjectType,
  GQLiteralInputObjectType,
  GQLiteralEnumType,
  GQLiteralUnionType,
  GQLiteralInterfaceType,
} from "./core";
import * as Types from "./types";
import { propertyFieldResolver, suggestionList, objValues } from "./utils";
import { isObject } from "util";

const isPromise = (val: any): val is Promise<any> =>
  Boolean(val && typeof val.then === "function");

const NULL_DEFAULTS = {
  output: false,
  outputList: false,
  outputListItem: false,
  input: true,
  inputList: true,
  inputListItem: false,
};

const SCALARS: Record<string, GraphQLScalarType> = {
  String: GraphQLString,
  Int: GraphQLInt,
  Float: GraphQLFloat,
  ID: GraphQLID,
  Boolean: GraphQLBoolean,
};

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
   * GQLiteral and haven't been processed into concrete types yet.
   */
  protected pendingTypeMap: Record<string, Types.GQLiteralNamedType> = {};

  protected pendingDirectiveMap: Record<
    string,
    GQLiteralDirectiveType<any>
  > = {};
  protected directiveMap: Record<string, GraphQLDirective> = {};

  constructor(
    protected metadata: GQLiteralMetadata,
    protected nullability: Types.NullabilityConfig = {}
  ) {}

  addType(typeDef: Types.GQLiteralNamedType | GraphQLNamedType) {
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

  addDirective(directiveDef: GQLiteralDirectiveType<any> | GraphQLDirective) {
    if (isDirective(directiveDef)) {
      this.directiveMap[directiveDef.name] = directiveDef;
    } else {
      this.pendingDirectiveMap[directiveDef.name] = directiveDef;
    }
  }

  getFinalTypeMap(): Types.BuildTypes<any, any> {
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
    Object.keys(this.pendingDirectiveMap).forEach((key) => {});
    return {
      typeMap: this.finalTypeMap,
      metadata: this.metadata,
      directiveMap: this.directiveMap,
    };
  }

  directiveType(config: Types.DirectiveTypeConfig) {
    return new GraphQLDirective({
      name: config.name,
      locations: [],
    });
  }

  inputObjectType(config: Types.InputTypeConfig): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
      name: config.name,
      fields: () => this.buildInputObjectFields(config),
      description: config.description,
    });
  }

  objectType(config: Types.ObjectTypeConfig) {
    this.metadata.addObjectType(config);
    return new GraphQLObjectType({
      name: config.name,
      interfaces: () => config.interfaces.map((i) => this.getInterface(i)),
      description: config.description,
      fields: () => {
        const interfaceFields: GraphQLFieldConfigMap<any, any> = {};
        const allInterfaces = config.interfaces.map((i) =>
          this.getInterface(i)
        );
        allInterfaces.forEach((i) => {
          const iFields = i.getFields();
          // We need to take the interface fields and reconstruct them
          // this actually simplifies things becuase if we've modified
          // the field at all it needs to happen here.
          Object.keys(iFields).forEach((iFieldName) => {
            const { isDeprecated, args, ...rest } = iFields[iFieldName];
            interfaceFields[iFieldName] = {
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
          ...interfaceFields,
          ...this.buildObjectFields(config),
        };
      },
    });
  }

  interfaceType(config: Types.InterfaceTypeConfig) {
    const { name, resolveType, description } = config;
    return new GraphQLInterfaceType({
      name,
      fields: () => this.buildObjectFields(config),
      resolveType,
      description,
    });
  }

  enumType(config: Types.EnumTypeConfig) {
    return new GraphQLEnumType({
      name: config.name,
      values: this.buildEnumMembers(config),
    });
  }

  unionType(config: Types.UnionTypeConfig) {
    return new GraphQLUnionType({
      name: config.name,
      types: () => this.buildUnionMembers(config),
      resolveType: config.resolveType,
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

  protected buildEnumMembers(config: Types.EnumTypeConfig) {
    let values: GraphQLEnumValueConfigMap = {};
    config.members.forEach((member) => {
      switch (member.item) {
        case Types.NodeType.ENUM_MEMBER:
          values[member.info.name] = {
            value: member.info.value,
            description: member.info.description,
          };
          break;
        case Types.NodeType.MIX:
          const {
            mixOptions: { pick, omit },
            typeName,
          } = member;
          const enumToMix = this.getEnum(typeName);
          enumToMix.getValues().forEach((val) => {
            if (pick && pick.indexOf(val.name) === -1) {
              return;
            }
            if (omit && omit.indexOf(val.name) !== -1) {
              return;
            }
            values[val.name] = {
              description: val.description,
              deprecationReason: val.deprecationReason,
              value: val.value,
              // astNode: val.astNode,
            };
          });
      }
    });
    if (!Object.keys(values).length) {
      throw new Error(
        `GQLiteral: Enum ${config.name} must have at least one member`
      );
    }
    return values;
  }

  protected buildUnionMembers(config: Types.UnionTypeConfig) {
    const unionMembers: GraphQLObjectType[] = [];
    config.members.forEach((member) => {
      switch (member.item) {
        case Types.NodeType.UNION_MEMBER:
          unionMembers.push(this.getObjectType(member.typeName));
          break;
        case Types.NodeType.MIX:
          const {
            mixOptions: { pick, omit },
            typeName,
          } = member;
          const unionToMix = this.getUnion(typeName);
          unionToMix.getTypes().forEach((type) => {
            if (pick && pick.indexOf(type.name) === -1) {
              return;
            }
            if (omit && omit.indexOf(type.name) !== -1) {
              return;
            }
            unionMembers.push(type);
          });
          break;
      }
    });
    if (!Object.keys(unionMembers).length) {
      throw new Error(
        `GQLiteral: Union ${config.name} must have at least one member type`
      );
    }
    return unionMembers;
  }

  protected buildObjectFields(
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig
  ): GraphQLFieldConfigMap<any, any> {
    const fieldMap: GraphQLFieldConfigMap<any, any> = {};
    typeConfig.fields.forEach((field) => {
      switch (field.item) {
        case Types.NodeType.MIX:
          throw new Error("TODO");
          break;
        case Types.NodeType.MIX_ABSTRACT:
          this.mixAbstractOuput(
            typeConfig,
            fieldMap,
            field.type,
            field.mixOptions
          );
          break;
        case Types.NodeType.FIELD:
          fieldMap[field.config.name] = this.buildObjectField(
            field.config,
            typeConfig
          );
          break;
      }
    });
    return fieldMap;
  }

  protected buildInputObjectFields(
    typeConfig: Types.InputTypeConfig
  ): GraphQLInputFieldConfigMap {
    const fieldMap: GraphQLInputFieldConfigMap = {};
    typeConfig.fields.forEach((field) => {
      switch (field.item) {
        case Types.NodeType.MIX:
          throw new Error("TODO");
          break;
        case Types.NodeType.MIX_ABSTRACT:
          this.mixAbstractInput(
            typeConfig,
            fieldMap,
            field.type,
            field.mixOptions
          );
          break;
        case Types.NodeType.FIELD:
          fieldMap[field.config.name] = this.buildInputObjectField(
            field.config,
            typeConfig
          );
          break;
      }
    });
    return fieldMap;
  }

  protected mixAbstractOuput(
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig,
    fieldMap: GraphQLFieldConfigMap<any, any>,
    type: GQLiteralAbstractType<any>,
    { pick, omit }: Types.MixOpts<any>
  ) {
    const { fields } = type.buildType();
    fields.forEach((field) => {
      if (pick && pick.indexOf(field.name) === -1) {
        return;
      }
      if (omit && omit.indexOf(field.name) !== -1) {
        return;
      }
      fieldMap[field.name] = this.buildObjectField(field, typeConfig);
    });
  }

  protected mixAbstractInput(
    typeConfig: Types.InputTypeConfig,
    fieldMap: GraphQLInputFieldConfigMap,
    type: GQLiteralAbstractType<any>,
    { pick, omit }: Types.MixOpts<any>
  ) {
    const { fields } = type.buildType();
    fields.forEach((field) => {
      if (pick && pick.indexOf(field.name) === -1) {
        return;
      }
      if (omit && omit.indexOf(field.name) !== -1) {
        return;
      }
      fieldMap[field.name] = this.buildInputObjectField(field, typeConfig);
    });
  }

  protected buildObjectField(
    fieldConfig: Types.FieldConfig,
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig
  ): GraphQLFieldConfig<any, any> {
    this.metadata.addField(typeConfig.name, fieldConfig);
    return {
      type: this.decorateOutputType(
        this.getOutputType(fieldConfig.type),
        fieldConfig,
        typeConfig
      ),
      resolve: this.getResolver(fieldConfig, typeConfig),
      description: fieldConfig.description,
      args: this.buildArgs(fieldConfig.args || {}, typeConfig),
      // TODO: Need to look into subscription semantics and how
      // resolution works for them.
      // subscribe: fieldConfig.subscribe,
      // deprecationReason?: Maybe<string>;
    };
  }

  protected buildInputObjectField(
    field: Types.FieldConfig,
    typeConfig: Types.InputTypeConfig
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
    args: Types.OutputFieldArgs,
    typeConfig: Types.InputTypeConfig
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
    fieldConfig: Types.InputFieldConfig,
    typeConfig: Types.InputTypeConfig
  ) {
    const { required: _required, requiredListItem, ...rest } = fieldConfig;
    const newOpts = rest;
    if (typeof _required !== "undefined") {
      newOpts.nullable = !_required;
    }
    if (typeof requiredListItem !== "undefined") {
      if (rest.list) {
        newOpts.listItemNullable = !requiredListItem;
      }
    }
    return this.decorateType(type, newOpts, typeConfig, true);
  }

  protected decorateOutputType(
    type: GraphQLOutputType,
    fieldConfig: Types.FieldConfig,
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig
  ) {
    return this.decorateType(type, fieldConfig, typeConfig, false);
  }

  protected decorateArgType(
    type: GraphQLInputType,
    argOpts: Types.ArgDefinition & { name: string },
    typeConfig: Types.InputTypeConfig
  ) {
    const { required: _required, requiredListItem, ...rest } = argOpts;
    const newOpts = rest;
    if (typeof _required !== "undefined") {
      newOpts.nullable = !_required;
    }
    if (typeof requiredListItem !== "undefined") {
      if (rest.list) {
        newOpts.listItemNullable = !requiredListItem;
      }
    }
    return this.decorateType(type, newOpts, typeConfig, true);
  }

  /**
   * Adds the null / list configuration to the type.
   */
  protected decorateType(
    type: GraphQLOutputType,
    fieldConfig: Types.Omit<Types.FieldConfig, "type">,
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig,
    isInput: false
  ): GraphQLOutputType;
  protected decorateType(
    type: GraphQLInputType,
    fieldConfig: Types.Omit<Types.FieldConfig, "type">,
    typeConfig: Types.InputTypeConfig,
    isInput: true
  ): GraphQLInputType;
  protected decorateType(
    type: any,
    fieldConfig: Types.Omit<Types.FieldConfig, "type">,
    typeConfig:
      | Types.ObjectTypeConfig
      | Types.InterfaceTypeConfig
      | Types.InputTypeConfig,
    isInput: boolean
  ): any {
    let finalType = type;
    const nullConfig: typeof NULL_DEFAULTS = {
      ...NULL_DEFAULTS,
      ...this.nullability,
      ...typeConfig.nullability,
    };
    const { list, nullable, listDepth, listItemNullable } = fieldConfig;
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
        `Expected ${name} to be a GraphQLInterfaceType, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getEnum(name: string): GraphQLEnumType {
    const type = this.getOrBuildType(name);
    if (!isEnumType(type)) {
      throw new Error(
        `Expected ${name} to be a GraphQLEnumType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getUnion(name: string): GraphQLUnionType {
    const type = this.getOrBuildType(name);
    if (!isUnionType(type)) {
      throw new Error(
        `Expected ${name} to be a GraphQLUnionType, saw ${
          type.constructor.name
        }`
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
        `Expected ${name} to be a GraphQLObjectType, saw ${
          type.constructor.name
        }`
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
        `GQLiteral: Circular dependency detected, while building types ${Array.from(
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
    fieldOptions: Types.FieldConfig,
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig
  ) {
    let resolver = typeConfig.defaultResolver || defaultFieldResolver;
    if (fieldOptions.resolve) {
      if (typeof fieldOptions.property !== "undefined") {
        console.warn(
          `Both resolve and property should not be supplied, property will be ignored`
        );
      }
      resolver = fieldOptions.resolve;
    } else if (fieldOptions.property) {
      resolver = propertyFieldResolver(fieldOptions.property);
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
    `${name} was already defined as a GraphQL type, check the docs for extending`
  );
}

/**
 * Builds the types, normalizing the "types" passed into the schema for a
 * better developer experience. This is primarily useful for testing
 * type generation
 */
export function buildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType> = any,
  DirectiveDefs extends Record<string, GraphQLDirective> = any
>(
  types: any,
  config: Types.Omit<Types.SchemaConfig<any>, "types"> = { outputs: false }
): Types.BuildTypes<TypeMapDefs, DirectiveDefs> {
  const metadata = new GQLiteralMetadata(config);
  const builder = new SchemaBuilder(metadata, config.nullability);
  addTypes(builder, types);
  return builder.getFinalTypeMap();
}

function addTypes(builder: SchemaBuilder, types: any) {
  if (!types) {
    return;
  }
  if (isGQLiteralNamedType(types) || isNamedType(types)) {
    builder.addType(types);
  } else if (types instanceof GQLiteralDirectiveType || isDirective(types)) {
    builder.addDirective(types);
  } else if (Array.isArray(types)) {
    types.forEach((typeDef) => addTypes(builder, typeDef));
  } else if (isObject(types)) {
    Object.keys(types).forEach((key) => addTypes(builder, types[key]));
  }
}

/**
 * Builds the schema, returning both the schema and metadata.
 */
export function buildSchemaWithMetadata<GenTypes = GQLiteralGen>(
  options: Types.SchemaConfig<GenTypes>
): { metadata: GQLiteralMetadata; schema: GraphQLSchema } {
  const { typeMap: typeMap, directiveMap: directiveMap, metadata } = buildTypes(
    options.types,
    options
  );
  const { Query, Mutation, Subscription } = typeMap;
  if (!isObjectType(Query)) {
    throw new Error("You must supply a Query type to create a valid schema");
  }
  if (Mutation && !isObjectType(Mutation)) {
    throw new Error(
      `Expected Mutation to be a GraphQLObjectType, saw ${
        Mutation.constructor.name
      }`
    );
  }
  if (Subscription && !isObjectType(Subscription)) {
    throw new Error(
      `Expected Subscription to be a GraphQLObjectType, saw ${
        Subscription.constructor.name
      }`
    );
  }

  const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
    directives: objValues(directiveMap),
    types: objValues(typeMap),
  });

  metadata.finishConstruction();

  return { schema, metadata };
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GQLiteral layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function buildSchema<GenTypes = GQLiteralGen>(
  options: Types.SchemaConfig<GenTypes>
): GraphQLSchema {
  const { schema, metadata } = buildSchemaWithMetadata<GenTypes>(options);

  // Only in development envs do we want to worry about regenerating the
  // schema definition and/or generated types.
  const {
    shouldGenerateArtifacts = process.env.NODE_ENV !== "production",
  } = options;

  if (shouldGenerateArtifacts) {
    metadata.generateArtifacts(schema);
  }

  return schema;
}

export function isGQLiteralNamedType(
  obj: any
): obj is Types.GQLiteralNamedType {
  return (
    obj instanceof GQLiteralObjectType ||
    obj instanceof GQLiteralInputObjectType ||
    obj instanceof GQLiteralEnumType ||
    obj instanceof GQLiteralUnionType ||
    obj instanceof GQLiteralInterfaceType
  );
}
