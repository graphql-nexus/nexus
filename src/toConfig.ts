import {
  GraphQLScalarType,
  GraphQLObjectType,
  GraphQLArgument,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldMap,
  GraphQLInterfaceType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLSchema,
  GraphQLSchemaConfig,
  GraphQLNamedType,
  isObjectType,
  isInterfaceType,
  isScalarType,
  isUnionType,
  isEnumType,
  isInputObjectType,
  GraphQLOutputType,
  GraphQLInputType,
  isNonNullType,
  isListType,
} from "graphql";
import { keyValMap, mapValue, objValues, eachObj } from "./utils";
import { AllNexusNamedTypeDefs } from "./definitions/wrapping";
import { objectType } from "./definitions/objectType";
import { scalarType } from "./definitions/scalarType";
import { interfaceType } from "./definitions/interfaceType";
import { unionType } from "./definitions/unionType";
import { enumType } from "./definitions/enumType";
import { inputObjectType } from "./definitions/inputObjectType";
import { arg } from "./definitions/args";

/**
 * Converts a schema to an array of Nexus compatible types.
 */
export function schemaToNexusConfig(
  schema: GraphQLSchema
): AllNexusNamedTypeDefs[] {
  const { types } = polyfillSchemaToConfig(schema);
  return types.map((t) => toNexusConfig(t));
}

/**
 * Converts the native GraphQL object types first toConfig, polyfilling
 * if necessary - then to Nexus' syntax so it's consistent with how we process
 * the types internally.
 */
export function toNexusConfig(type: GraphQLNamedType): AllNexusNamedTypeDefs {
  if (isScalarType(type)) {
    const config = polyfillScalarToConfig(type);
    return scalarType(config);
  }
  if (isObjectType(type)) {
    const config = polyfillObjectToConfig(type);
    return objectType({
      name: config.name,
      definition(t) {
        eachObj(config.fields, (val, key) => {
          t.field(key, {
            type: extractTypeName(val.type),
            list: extractList(val.type),
            nullable: !isNonNullType(val.type),
            resolve: val.resolve,
            args: extractArgs(val.args),
          });
        });
      },
    });
  }
  if (isInterfaceType(type)) {
    const config = polyfillInterfaceToConfig(type);
    return interfaceType({
      name: config.name,
      definition(t) {
        eachObj(config.fields, (val, key) => {
          t.field(key, {
            type: extractTypeName(val.type),
            list: extractList(val.type),
            nullable: !isNonNullType(val.type),
            resolve: val.resolve,
            args: extractArgs(val.args),
          });
        });
      },
    });
  }
  if (isUnionType(type)) {
    const config = polyfillUnionToConfig(type);
    return unionType({
      name: config.name,
      definition(t) {
        if (typeof config.resolveType === "function") {
          t.resolveType(config.resolveType);
        }
        t.members(...config.types.map(({ name }) => name));
      },
    });
  }
  if (isEnumType(type)) {
    const config = polyfillEnumToConfig(type);
    return enumType({
      name: type.name,
      members: config.values,
    });
  }
  if (isInputObjectType(type)) {
    const config = polyfillInputObjectToConfig(type);
    return inputObjectType({
      name: type.name,
      definition(t) {
        eachObj(config.fields, (val, key) => {
          t.field(key, {
            type: extractTypeName(val.type),
            list: extractList(val.type),
            nullable: !isNonNullType(val.type),
            description: val.description,
          });
        });
      },
    });
  }
  throw new Error(`Invalid type ${type}`);
}

/**
 * Extracts the core "type" name, removing nullable / list
 */
export function extractTypeName(
  type: GraphQLOutputType | GraphQLInputType
): string {
  while (isNonNullType(type) || isListType(type)) {
    type = type.ofType;
  }
  return type.name;
}

/**
 * Extract a "list" array as it
 */
export function extractList(
  type: GraphQLOutputType | GraphQLInputType
): boolean[] | undefined {
  if (isNonNullType(type)) {
    type = type.ofType;
  }
  const list: boolean[] = [];
  while (isListType(type)) {
    type = type.ofType;
    if (isNonNullType(type)) {
      type = type.ofType;
      list.push(true);
    } else {
      list.push(false);
    }
  }
  return list.length ? list : undefined;
}

export function extractArgs(args: GraphQLFieldConfigArgumentMap = {}) {
  return mapValue(args, (val, key) => {
    return arg({
      type: extractTypeName(val.type),
      list: extractList(val.type),
      description: val.description,
      default: val.defaultValue,
    });
  });
}

export function polyfillSchemaToConfig(
  schema: GraphQLSchema
): GraphQLSchemaConfig & ReturnType<GraphQLSchema["toConfig"]> {
  if (schema.toConfig) {
    return schema.toConfig();
  }
  return {
    types: objValues(schema.getTypeMap()),
    directives: schema.getDirectives().slice(),
    query: schema.getQueryType(),
    mutation: schema.getMutationType(),
    subscription: schema.getSubscriptionType(),
    astNode: schema.astNode,
    extensionASTNodes: schema.extensionASTNodes || [],
  };
}

export function polyfillScalarToConfig(
  type: GraphQLScalarType
): ReturnType<GraphQLScalarType["toConfig"]> {
  if (type.toConfig) {
    return type.toConfig();
  }
  return {
    name: type.name,
    description: type.description,
    serialize: type.serialize,
    parseValue: type.parseValue,
    parseLiteral: type.parseLiteral,
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

export function polyfillObjectToConfig(
  type: GraphQLObjectType
): ReturnType<GraphQLObjectType["toConfig"]> {
  if (type.toConfig) {
    return type.toConfig();
  }
  return {
    name: type.name,
    description: type.description,
    isTypeOf: type.isTypeOf,
    interfaces: type.getInterfaces(),
    fields: fieldsToFieldsConfig(type.getFields()),
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

export function polyfillInterfaceToConfig(
  type: GraphQLInterfaceType
): ReturnType<GraphQLInterfaceType["toConfig"]> {
  if (type.toConfig) {
    return type.toConfig();
  }
  return {
    name: type.name,
    description: type.description,
    resolveType: type.resolveType,
    fields: fieldsToFieldsConfig(type.getFields()),
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

export function polyfillUnionToConfig(type: GraphQLUnionType) {
  if (type.toConfig) {
    return type.toConfig();
  }
  return {
    name: type.name,
    description: type.description,
    resolveType: type.resolveType,
    types: type.getTypes(),
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

export function polyfillEnumToConfig(
  type: GraphQLEnumType
): ReturnType<GraphQLEnumType["toConfig"]> {
  if (type.toConfig) {
    return type.toConfig();
  }
  const values = keyValMap(
    type.getValues(),
    (value) => value.name,
    (value) => ({
      description: value.description,
      value: value.value,
      deprecationReason: value.deprecationReason,
      astNode: value.astNode,
    })
  );

  return {
    name: type.name,
    description: type.description,
    values,
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

export function polyfillInputObjectToConfig(
  type: GraphQLInputObjectType
): ReturnType<GraphQLInputObjectType["toConfig"]> {
  if (type.toConfig) {
    return type.toConfig();
  }
  const fields = mapValue(type.getFields(), (field) => ({
    description: field.description,
    type: field.type,
    defaultValue: field.defaultValue,
    astNode: field.astNode,
  }));

  return {
    name: type.name,
    description: type.description,
    fields,
    astNode: type.astNode,
    extensionASTNodes: type.extensionASTNodes || [],
  };
}

function fieldsToFieldsConfig(fields: GraphQLFieldMap<any, any>) {
  return mapValue(fields, (field) => ({
    type: field.type,
    args: argsToArgsConfig(field.args),
    resolve: field.resolve,
    subscribe: field.subscribe,
    deprecationReason: field.deprecationReason,
    description: field.description,
    astNode: field.astNode,
  }));
}

function argsToArgsConfig(
  args: Array<GraphQLArgument>
): GraphQLFieldConfigArgumentMap {
  return keyValMap(
    args,
    (a) => a.name,
    (a) => ({
      type: a.type,
      defaultValue: a.defaultValue,
      description: a.description,
      astNode: a.astNode,
    })
  );
}
