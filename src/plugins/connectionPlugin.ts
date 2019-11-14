import { plugin } from "../plugin";
import { dynamicOutputMethod } from "../dynamicMethod";
import { intArg, ArgsRecord, stringArg } from "../definitions/args";
import { ObjectDefinitionBlock, objectType } from "../definitions/objectType";
import { printedGenTypingImport, eachObj, mapObj, isObject } from "../utils";
import {
  FieldResolver,
  GetGen,
  RootValue,
  ArgsValue,
  MaybePromise,
  ResultValue,
} from "../typegenTypeHelpers";
import { FieldOutConfig } from "../definitions/definitionBlocks";
import { AllNexusOutputTypeDefs } from "../definitions/wrapping";
import { GraphQLResolveInfo } from "graphql";

export interface ConnectionPluginConfig {
  /**
   * What the connection field is defined as on the object
   * definition block.
   *
   * @default 'connectionField'
   */
  nexusFieldName?: string;
  /**
   * Whether we want the inputs to follow the spec, or if we
   * want something different across the board
   * for instance - { input: { pageSize: intArg(), page: intArg() } }
   */
  args?: ArgsRecord;
  /**
   * Whether we want the "edges" field on the connection / need to
   * implement this in the contract.
   *
   * @default true
   */
  edges?: boolean;
  /**
   * Whether we want a "nodes" field on the connection / need to
   * implement this in the contract.
   *
   * @default false
   */
  nodes?: boolean;
  /**
   * Whether we want "pageInfo" field on the connection / need to
   * implement this in the contract.
   *
   * @default true
   */
  pageInfo?: boolean;
  /**
   * Setting to true means that Nexus will automatically add the cursor
   * property for each node in the list.
   *
   * @default true
   */
  autoCursor?: boolean;
  /**
   * Extend *all* edges to include additional fields, beyond cursor and node
   */
  extendEdge?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * Any additional fields we want to make available to the connection type,
   * beyond edges and/or node
   */
  extendConnection?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * Any additional fields we want to make available to the all pageInfo fields,
   * beyond edges and/or node
   */
  extendPageInfo?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
}

export interface ConnectionFieldConfig {
  type: GetGen<"allOutputTypes", string> | AllNexusOutputTypeDefs;
  /**
   * Args we want to use for this field.
   */
  args?: ArgsRecord;
  /**
   * Takes the args, and returns the args we should use in place for this field
   */
  extendArgs?: (args: ArgsRecord) => ArgsRecord;
  /**
   * Dynamically adds additional fields to the current "connection" as it is define
   */
  extendConnection?: (def: ObjectDefinitionBlock<any>) => void;
  /**
   * Dynamically adds additional fields to the connection "edge" as it is defined
   */
  extendEdge?: (def: ObjectDefinitionBlock<any>) => void;
  /**
   * Dynamically adds additional fields to the connection "pageInfo" as it is defined
   */
  extendPageInfo?: (def: ObjectDefinitionBlock<any>) => void;
}

const FieldInfoArgs = {
  first: intArg(),
  after: stringArg(),
  last: intArg(),
  before: stringArg(),
};

const defaultConfig: ConnectionPluginConfig = {
  args: FieldInfoArgs,
  edges: true,
  nodes: false,
  pageInfo: true,
  autoCursor: true,
  nexusFieldName: "connectionField",
};

export type ConnectionNodesResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<Array<ResultValue<TypeName, FieldName>["edges"]["node"]>>;

export type EdgeFieldResolver<
  TypeName extends string,
  FieldName extends string,
  EdgeField extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<TypeName, FieldName>["edges"][EdgeField]>;

export type PageInfoFieldResolver<
  TypeName extends string,
  FieldName extends string,
  EdgeField extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<TypeName, FieldName>["pageInfo"][EdgeField]>;

export const connectionPlugin = (
  config: "spec" | ConnectionPluginConfig = "spec"
) => {
  const finalConfig: ConnectionPluginConfig =
    config === "spec" ? defaultConfig : { ...defaultConfig, ...config };
  return plugin({
    name: "ConnectionPlugin",
    fieldDefTypes: [
      printedGenTypingImport({
        module: "nexus",
        bindings: ["core", "ConnectionFieldConfig"],
      }),
      printedGenTypingImport({
        module: "nexus/dist/plugins/connectionPlugin",
        bindings: [
          "ConnectionNodesResolver",
          "EdgeFieldResolver",
          "PageInfoFieldResolver",
        ],
      }),
    ],
    // Defines the field added to the definition block:
    // t.connectionField('fieldName', {
    //   type: User
    // })
    onInstall(b) {
      let dynamicConfig = [];

      const {
        args = FieldInfoArgs,
        edges,
        extendConnection,
        extendEdge,
        extendPageInfo,
        nodes,
        autoCursor,
        nexusFieldName = "connectionField",
        pageInfo,
      } = finalConfig;

      // If we want the "edges" field, add the type definition for it. If the "autoCursor"
      // is true, meaning our library creates cursors automatically, then we want the return
      // type to be an array, otherwise it's the edges field typing.
      if (edges) {
        dynamicConfig.push(
          autoCursor
            ? `edges: ConnectionNodesResolver<TypeName, FieldName>`
            : `edges: core.SubFieldResolver<TypeName, FieldName, "edges">`
        );
      }

      if (pageInfo) {
        dynamicConfig.push(
          `pageInfo: core.SubFieldResolver<TypeName, FieldName, "pageInfo">`
        );
      }

      if (nodes) {
        dynamicConfig.push(
          `nodes: core.SubFieldResolver<TypeName, FieldName, "nodes">`
        );
      }

      // If we want to add fields to every connection, we require the resolver be defined on the
      // field definition.
      if (extendConnection) {
        eachObj(extendConnection, (val, key) => {
          dynamicConfig.push(
            `${key}: core.SubFieldResolver<TypeName, FieldName, "${key}">`
          );
        });
      }

      if (extendEdge) {
        const edgeFields = mapObj(
          extendEdge,
          (val, key) =>
            `${key}: EdgeFieldResolver<TypeName, FieldName, "${key}">`
        );
        dynamicConfig.push(`edgeFields: { ${edgeFields.join(", ")} }`);
      }

      if (extendPageInfo) {
        const pageInfoFields = mapObj(
          extendPageInfo,
          (val, key) =>
            `${key}: PageInfoFieldResolver<TypeName, FieldName, "${key}">`
        );
        dynamicConfig.push(`pageInfoFields: { ${pageInfoFields.join(", ")} }`);
      }

      const printedDynamicConfig = `{ ${dynamicConfig.join(", ")} }`;

      // Add the t.connectionField (or something else if we've changed the name)
      b.addType(
        dynamicOutputMethod({
          name: nexusFieldName,
          typeDefinition: `<FieldName extends string>(
            fieldName: FieldName, 
            config: ConnectionFieldConfig & ${printedDynamicConfig}
          ): void`,
          factory({ typeName, typeDef: t, args: [fieldName, config] }) {
            const fieldConfig = config as ConnectionFieldConfig;
            const targetType = fieldConfig.type;
            const targetTypeName =
              typeof targetType === "string"
                ? targetType
                : (targetType.name as string);

            // If we have changed the config specific to this field, on either the connection,
            // edge, or page info, then we need a custom type for the connection & edge.
            const connectionName = isConnectionExtended(fieldConfig)
              ? `${typeName}${upperFirst(fieldName)}${targetTypeName}Connection`
              : `${targetTypeName}Connection`;

            // If we have modified the "edge" at all, then we need
            const edgeName = isEdgeExtended(fieldConfig)
              ? `${typeName}${upperFirst(fieldName)}${targetTypeName}Edge`
              : `${targetTypeName}Edge`;

            // If we have modified the "edge" at all, then we need a specific type
            // for this Connection, rather than the generic one.
            const pageInfoName = isPageInfoExtended(fieldConfig)
              ? `${typeName}${upperFirst(fieldName)}${targetTypeName}PageInfo`
              : `PageInfo`;

            assertCorrectConfig(typeName, fieldName, finalConfig, config);

            // Add the "Connection" type to the schema if it doesn't exist already
            if (!b.hasType(connectionName)) {
              b.addType(
                objectType({
                  name: connectionName,
                  definition(t2) {
                    if (nodes) {
                      t2.list.field("nodes", {
                        type: targetType,
                      });
                    }
                    if (edges) {
                      t2.field("edges", {
                        type: edgeName,
                      });
                    }
                    if (pageInfo) {
                      t2.field("pageInfo", {
                        type: pageInfoName,
                        nullable: false,
                      });
                    }
                    if (extendConnection) {
                      eachObj(extendConnection, (val, key) => {
                        t2.field(key, val);
                      });
                    }
                    if (config.extendConnection instanceof Function) {
                      config.extendConnection(t2);
                    }
                  },
                })
              );
            }

            // Add the "Edge" type to the schema if it doesn't exist already
            if (!b.hasType(edgeName)) {
              b.addType(
                objectType({
                  name: edgeName,
                  definition(t2) {
                    t2.string("cursor");
                    t2.field("node", { type: targetType });
                    if (extendEdge) {
                      eachObj(extendEdge, (val, key) => {
                        t2.field(key, val);
                      });
                    }
                    if (config.extendEdge instanceof Function) {
                      config.extendEdge(t2);
                    }
                  },
                })
              );
            }

            // Add the "PageInfo" type to the schema if it doesn't exist already
            if (!b.hasType(pageInfoName)) {
              b.addType(
                objectType({
                  name: pageInfoName,
                  description:
                    "PageInfo cursor, as defined in https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo",
                  definition(t2) {
                    t2.boolean("hasNextPage", { nullable: false });
                    t2.boolean("hasPreviousPage", { nullable: false });
                    t2.string("startCursor", { nullable: false });
                    t2.string("endCursor", { nullable: false });
                    if (extendPageInfo) {
                      eachObj(extendPageInfo, (val, key) => {
                        t2.field(key, val);
                      });
                    }
                    if (config.extendPageInfo instanceof Function) {
                      config.extendPageInfo(t2);
                    }
                  },
                })
              );
            }

            const fieldArgs = fieldConfig.extendArgs
              ? fieldConfig.extendArgs(args)
              : config.args || finalConfig.args;

            // Add the field to the type.
            t.field(fieldName, {
              ...config,
              args: fieldArgs,
              type: connectionName,
              resolve(root, args, ctx, info) {
                const resolveObj: Record<string, FieldResolver<any, any>> = {};

                if (edges) {
                  if (autoCursor) {
                    resolveObj.edges = (a, b, c, info) => {
                      return plugin.completeValue(
                        config.edges(root, args, ctx, info),
                        (edgeItems) => {
                          return edgeItems;
                        }
                      );
                    };
                  } else {
                    resolveObj.edges = (a, b, c, info) =>
                      config.edges(root, args, ctx, info);
                  }
                }

                if (nodes) {
                  resolveObj.nodes = (a, b, c, info) =>
                    config.nodes(root, args, ctx, info);
                }

                if (pageInfo) {
                  resolveObj.pageInfo = (a, b, c, info) =>
                    config.pageInfo(root, args, ctx, info);
                }
              },
            });
          },
        })
      );
      // TODO: Deprecate this syntax
      return { types: [] };
    },
  });
};

const isConnectionExtended = (config: ConnectionFieldConfig) => {
  if (
    config.extendConnection ||
    isEdgeExtended(config) ||
    isPageInfoExtended(config)
  ) {
    return true;
  }
  return false;
};

const isEdgeExtended = (config: ConnectionFieldConfig) => {
  if (config.extendEdge) {
    return true;
  }
  return false;
};

const isPageInfoExtended = (config: ConnectionFieldConfig) => {
  if (config.extendPageInfo) {
    return true;
  }
  return false;
};

const upperFirst = (fieldName: string) => {
  return fieldName
    .slice(0, 1)
    .toUpperCase()
    .concat(fieldName.slice(1));
};

// Add some sanity checking beyond the normal type checks.
const assertCorrectConfig = (
  typeName: string,
  fieldName: string,
  finalConfig: ConnectionPluginConfig,
  config: any
) => {
  if (finalConfig.edges && typeof config.edges !== "function") {
    console.error(
      new Error(
        `Nexus Connection Plugin: Missing edges resolver property for ${typeName}.${fieldName}`
      )
    );
  }
  if (finalConfig.nodes && typeof config.nodes !== "function") {
    console.error(
      new Error(
        `Nexus Connection Plugin: Missing nodes resolver property for ${typeName}.${fieldName}`
      )
    );
  }
  if (finalConfig.pageInfo && typeof config.pageInfo !== "function") {
    console.error(
      new Error(
        `Nexus Connection Plugin: Missing pageInfo resolver property for ${typeName}.${fieldName}`
      )
    );
  }
  eachObj(finalConfig.extendConnection || {}, (val, key) => {
    if (typeof config[key] !== "function") {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing ${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
  eachObj(finalConfig.extendEdge || {}, (val, key) => {
    if (
      !isObject(config.edgeFields) ||
      typeof config.edgeFields[key] !== "function"
    ) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing edgeFields.${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
  eachObj(finalConfig.extendPageInfo || {}, (val, key) => {
    if (
      !isObject(config.pageInfoFields) ||
      typeof config.pageInfoFields[key] !== "function"
    ) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing pageInfoFields.${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
};
