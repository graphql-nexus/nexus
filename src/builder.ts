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
} from "graphql";
import { GQLiteralTypeWrapper } from "./definitions";
import * as Types from "./types";
import suggestionList, { propertyFieldResolver } from "./utils";
import { GQLiteralAbstract } from "./objects";

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
  protected buildingTypes = new Set();
  protected finalTypeMap: Record<string, GraphQLNamedType> = {};
  protected pendingTypeMap: Record<string, GQLiteralTypeWrapper> = {};

  constructor(
    protected schemaConfig: Types.Omit<Types.SchemaConfig, "types">
  ) {}

  addType(typeDef: GQLiteralTypeWrapper | GraphQLNamedType) {
    if (this.finalTypeMap[typeDef.name] || this.pendingTypeMap[typeDef.name]) {
      throw new Error(`Named type ${typeDef.name} declared more than once`);
    }
    if (isNamedType(typeDef)) {
      this.finalTypeMap[typeDef.name] = typeDef;
    } else {
      this.pendingTypeMap[typeDef.name] = typeDef;
    }
  }

  getFinalTypeMap(): Record<string, GraphQLNamedType> {
    Object.keys(this.pendingTypeMap).forEach((key) => {
      // If we've already constructed the type by this point,
      // via circular dependency resolution don't worry about building it.
      if (this.finalTypeMap[key]) {
        return;
      }
      this.finalTypeMap[key] = this.getOrBuildType(key);
      this.buildingTypes.clear();
    });
    return this.finalTypeMap;
  }

  inputObjectType(config: Types.InputTypeConfig): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
      name: config.name,
      fields: () => this.buildInputObjectFields(config),
      description: config.description,
    });
  }

  objectType(config: Types.ObjectTypeConfig) {
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
          Object.keys(iFields).forEach((iFieldName) => {
            const { isDeprecated, args, ...rest } = iFields[iFieldName];
            interfaceFields[iFieldName] = {
              ...rest,
              args: args.reduce(
                (result: GraphQLFieldConfigArgumentMap, arg) => {
                  const { name, ...rest } = arg;
                  result[name] = rest;
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
      // astNode?: Maybe<InterfaceTypeDefinitionNode>;
      // extensionASTNodes?: Maybe<ReadonlyArray<InterfaceTypeExtensionNode>>;
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
              astNode: val.astNode,
            };
          });
      }
    });
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
    typeConfig: Types.InputTypeConfig,
    fieldMap: GraphQLFieldConfigMap<any, any>,
    type: GQLiteralAbstract<any>,
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
    type: GQLiteralAbstract<any>,
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
    return {
      type: this.decorateOutputType(
        this.getOutputType(fieldConfig.type),
        fieldConfig,
        // @ts-ignore
        typeConfig
      ),
      resolve: this.getResolver(fieldConfig, typeConfig),
      description: fieldConfig.description,
      args: this.buildArgs(fieldConfig.args || {}, typeConfig),
      // subscribe?: GraphQLFieldResolver<TSource, TContext, TArgs>;
      // deprecationReason?: Maybe<string>;
      // astNode?: Maybe<FieldDefinitionNode>;
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
          argDef,
          typeConfig
        ),
        description: argDef.description,
      };
    });
    return allArgs;
  }

  protected decorateInputType(
    type: GraphQLInputType,
    fieldConfig: Types.FieldConfig,
    typeConfig: Types.InputTypeConfig
  ) {
    return this.decorateType(type, fieldConfig, typeConfig, true);
  }

  protected decorateOutputType(
    type: GraphQLOutputType,
    fieldConfig: Types.FieldConfig,
    typeConfig: Types.ObjectTypeConfig
  ) {
    // @ts-ignore
    return this.decorateType(type, fieldConfig, typeConfig, false);
  }

  protected decorateArgType(
    type: GraphQLInputType,
    argOpts: Types.ArgOpts,
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
    type: GraphQLInputType,
    fieldConfig: Types.Omit<Types.FieldConfig, "name" | "type">,
    typeConfig: Types.ObjectTypeConfig | Types.InputTypeConfig,
    isInput: boolean
  ): GraphQLInputType {
    let finalType = type;
    const nullConfig = {
      ...NULL_DEFAULTS,
      ...this.schemaConfig.nullability,
      ...typeConfig.nullability,
    };
    const { list, nullable, listItemNullable } = fieldConfig;
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

    // TODO: Figure out how lists of lists will be represented.
    if (list) {
      const nullableItem =
        typeof listItemNullable !== "undefined"
          ? listItemNullable
          : isInput
            ? nullConfig.inputListItem
            : nullConfig.outputListItem;
      if (!nullableItem) {
        finalType = GraphQLNonNull(finalType);
      }
      finalType = GraphQLList(finalType);
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
      return pendingType.type.buildType(this);
    }
    return this.missingType(name);
  }

  protected getResolver(
    fieldOptions: Types.FieldConfig,
    typeConfig: Types.ObjectTypeConfig | Types.InterfaceTypeConfig
  ) {
    let resolver =
      typeConfig.defaultResolver ||
      this.schemaConfig.defaultResolver ||
      defaultFieldResolver;
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
    if (typeof fieldOptions.defaultValue !== "undefined") {
      resolver = withDefaultValue(resolver, fieldOptions.defaultValue);
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
      return defaultValue;
    }
    if (isPromise(result)) {
      return result.then((val: any) => {
        if (typeof val === "undefined" || val === null) {
          return defaultValue;
        }
        return val;
      });
    }
    return result;
  };
}
