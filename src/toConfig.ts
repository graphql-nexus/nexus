import {
  GraphQLObjectType,
  GraphQLArgument,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldMap,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
} from "graphql";
import { keyValMap, mapValue } from "./utils";

export function graphqlObjectToConfig(
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

export function graphqlInterfaceToConfig(
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

export function graphqlInputObjectToConfig(
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
