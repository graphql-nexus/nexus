import { plugin } from "../plugin";
import { dynamicOutputMethod } from "../dynamicMethod";
import { intArg, ArgsRecord, stringArg } from "../definitions/args";
import { ObjectDefinitionBlock, objectType } from "../definitions/objectType";
import {
  printedGenTypingImport,
  eachObj,
  mapObj,
  isObject,
  isPromiseLike,
} from "../utils";
import {
  GetGen,
  RootValue,
  ArgsValue,
  MaybePromise,
  ResultValue,
} from "../typegenTypeHelpers";
import { FieldOutConfig } from "../definitions/definitionBlocks";
import { AllNexusOutputTypeDefs } from "../definitions/wrapping";
import { GraphQLResolveInfo } from "graphql";
import { forEach } from "iterall";

export interface ConnectionPluginConfig {
  /**
   * What the connection field is defined as on the object
   * definition block.
   *
   * @default 'connectionField'
   */
  nexusFieldName?: string;
  /**
   * Whether we also want to expose the "nodes" directly on the connection for convenience.
   *
   * @default false
   */
  includeNodesField?: boolean;
  /**
   * Any args we want to include by default on all connection fields,
   * in addition to the ones in the spec.
   *
   * @default null
   */
  additionalArgs?: ArgsRecord;
  /**
   * Pass this value if you have logic you would like to use to validate the arguments.
   * Defaults to requiring that either a `first` or `last` is provided.
   */
  validateArgs?: (args: ArgsRecord) => boolean;
  /**
   * Default approach we use to transform a node into an unencoded cursor.
   *
   * Default is `cursor:${index}`
   *
   * @default "field"
   */
  cursorFromNode?: (node: any, args: PaginationArgs, index: number) => string;
  /**
   * Conversion from a cursor string into an opaque token. Defaults to base64Encode(string)
   */
  encodeCursor?: (value: string) => string;
  /**
   * Conversion from an opaque token into a cursor string. Defaults to base64Decode(string)
   */
  decodeCursor?: (cursor: string) => string;
  /**
   * Extend *all* edges to include additional fields, beyond cursor and node
   */
  extendEdge?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * Any additional fields we want to make available to the connection type,
   * beyond edges, pageInfo
   */
  extendConnection?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * Any additional fields we want to make available to the all pageInfo fields,
   * beyond hasNextPage, hasPreviousPage, startCursor, endCursor
   */
  extendPageInfo?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
}

export interface ConnectionFieldConfig<
  TypeName extends string = any,
  FieldName extends string = any
> {
  type: GetGen<"allOutputTypes", string> | AllNexusOutputTypeDefs;
  /**
   * Args we want to use for this field.
   */
  args?: ArgsRecord;
  /**
   * All of the nodes needed to fulfill the connection slice based on the pagination.
   */
  nodes: (
    root: RootValue<TypeName>,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<"context">,
    info: GraphQLResolveInfo
  ) => Iterable<ResultValue<TypeName, FieldName>["edges"]["node"]>;
  /**
   * Approach we use to transform a node into a cursor.
   *
   * @default "nodeField"
   */
  cursorFromNode?: (
    node: ResultValue<TypeName, FieldName>["edges"]["node"],
    args: ArgsValue<TypeName, FieldName>,
    index: number
  ) => string;
  /**
   * Whether the field allows for backward pagination
   */
  disableForwardPagination?: boolean;
  /**
   * Whether the field allows for backward pagination
   */
  disableBackwardPagination?: boolean;
  /**
   * Custom check for whether there is a next page for the pagination.
   */
  hasNextPage?: () => boolean;
  /**
   * Custom check for whether there is a previous page for the pagination.
   */
  hasPreviousPage?: () => boolean;
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
  first: intArg({
    nullable: true,
    description: "Returns the first n elements from the list.",
  }),
  after: stringArg({
    nullable: true,
    description:
      "Returns the elements in the list that come after the specified cursor",
  }),
  last: intArg({
    nullable: true,
    description: "Returns the last n elements from the list.",
  }),
  before: stringArg({
    nullable: true,
    description:
      "Returns the elements in the list that come before the specified cursor",
  }),
};

function base64Encode(str: string) {
  return Buffer.from(str, "utf8").toString("base64");
}

function base64Decode(str: string) {
  return Buffer.from(str, "base64").toString("utf8");
}

const defaultConfig: ConnectionPluginConfig = {
  nexusFieldName: "connectionField",
  includeNodesField: false,
  encodeCursor: base64Encode,
  decodeCursor: base64Decode,
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

type EdgeLike = { cursor: string; node: any };

// Used to break the `forEach` loop while while iterating a pagination connection.
const BREAK = {};

export const connectionPlugin = (
  connectionPluginConfig: "spec" | ConnectionPluginConfig = "spec"
) => {
  const pluginConfig: ConnectionPluginConfig =
    connectionPluginConfig === "spec"
      ? defaultConfig
      : { ...defaultConfig, ...connectionPluginConfig };

  // Define the plugin with the appropriate configuration.
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
    // t.connectionField('users', {
    //   type: User
    // })
    onInstall(b) {
      let dynamicConfig = [];

      const {
        additionalArgs = {},
        extendConnection,
        extendEdge,
        extendPageInfo,
        includeNodesField = false,
        encodeCursor = base64Encode,
        decodeCursor = base64Decode,
        cursorFromNode = defaultCursorFromNode,
        nexusFieldName = "connectionField",
      } = pluginConfig;

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
            config: ConnectionFieldConfig<TypeName, FieldName> & ${printedDynamicConfig}
          ): void`,
          factory({ typeName, typeDef: t, args: factoryArgs }) {
            const [fieldName, fieldConfig] = factoryArgs as [
              string,
              ConnectionFieldConfig
            ];
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

            assertCorrectConfig(typeName, fieldName, pluginConfig, fieldConfig);

            // Add the "Connection" type to the schema if it doesn't exist already
            if (!b.hasType(connectionName)) {
              b.addType(
                objectType({
                  name: connectionName,
                  definition(t2) {
                    t2.field("edges", {
                      type: edgeName,
                      description: `https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types`,
                    });

                    t2.field("pageInfo", {
                      type: pageInfoName,
                      nullable: false,
                      description: `https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo`,
                    });

                    if (includeNodesField) {
                      t2.list.field("nodes", {
                        type: targetType,
                        description: `Flattened list of ${targetTypeName} type`,
                      });
                    }

                    if (extendConnection) {
                      eachObj(extendConnection, (val, key) => {
                        t2.field(key, val);
                      });
                    }

                    if (fieldConfig.extendConnection instanceof Function) {
                      fieldConfig.extendConnection(t2);
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
                    t2.string("cursor", {
                      nullable: false,
                      description:
                        "https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor",
                      resolve(o) {
                        return encodeCursor(o.cursor);
                      },
                    });

                    t2.field("node", {
                      type: targetType,
                      description:
                        "https://facebook.github.io/relay/graphql/connections.htm#sec-Node",
                    });

                    if (extendEdge) {
                      eachObj(extendEdge, (val, key) => {
                        t2.field(key, val);
                      });
                    }

                    if (fieldConfig.extendEdge instanceof Function) {
                      fieldConfig.extendEdge(t2);
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
                    t2.boolean("hasNextPage", {
                      nullable: false,
                      description: `hasNextPage is used to indicate whether more edges exist following the set defined by the clients arguments. If the client is paginating with first/after, then the server must return true if further edges exist, otherwise false. If the client is paginating with last/before, then the client may return true if edges further from before exist, if it can do so efficiently, otherwise may return false.`,
                    });
                    t2.boolean("hasPreviousPage", {
                      nullable: false,
                      description: `hasPreviousPage is used to indicate whether more edges exist prior to the set defined by the clients arguments. If the client is paginating with last/before, then the server must return true if prior edges exist, otherwise false. If the client is paginating with first/after, then the client may return true if edges prior to after exist, if it can do so efficiently, otherwise may return false.`,
                    });
                    t2.string("startCursor", {
                      nullable: true,
                      description: `The cursor corresponding to the first nodes in edges. Null if the connection is empty.`,
                      resolve: (o) =>
                        o.startCursor ? encodeCursor(o.startCursor) : null,
                    });
                    t2.string("endCursor", {
                      nullable: true,
                      description: `The cursor corresponding to the last nodes in edges. Null if the connection is empty.`,
                      resolve: (o) =>
                        o.endCursor ? encodeCursor(o.endCursor) : null,
                    });

                    if (extendPageInfo) {
                      eachObj(extendPageInfo, (val, key) => {
                        t2.field(key, val);
                      });
                    }
                    if (fieldConfig.extendPageInfo instanceof Function) {
                      fieldConfig.extendPageInfo(t2);
                    }
                  },
                })
              );
            }

            const fieldArgs = {
              ...additionalArgs,
              ...FieldInfoArgs,
              ...(fieldConfig.args || {}),
            };

            const hasPreviousPageFn =
              typeof fieldConfig.hasPreviousPage === "function"
                ? fieldConfig.hasPreviousPage
                : defaultHasPreviousPage;

            const hasNextPageFn =
              typeof fieldConfig.hasNextPage === "function"
                ? fieldConfig.hasNextPage
                : defaultHasNextPage;

            // Add the field to the type.
            t.field(fieldName, {
              ...fieldConfig,
              args: fieldArgs,
              type: connectionName,
              resolve(root, args: PaginationArgs, ctx, info) {
                const formattedArgs = { ...args };

                if (args.after) {
                  formattedArgs.after = decodeCursor(args.after);
                }
                if (args.before) {
                  formattedArgs.before = decodeCursor(args.before);
                }

                const maxExpected = Math.max(
                  formattedArgs.first || 0,
                  formattedArgs.last || 0
                );

                // TODO: Validate Arguments

                // Local variable to cache the execution of fetching the nodes,
                // which is needed for all fields.
                let nodes: Promise<Iterable<any>>;
                let edges: Promise<Array<EdgeLike>>;

                function resolveNodes() {
                  if (nodes !== undefined) {
                    return nodes;
                  }
                  nodes = Promise.resolve(
                    fieldConfig.nodes(root, formattedArgs, ctx, info) || null
                  );
                  return nodes;
                }

                function resolveEdges() {
                  if (edges !== undefined) {
                    return edges;
                  }

                  edges = resolveNodes().then((nodes) => {
                    const resolvedEdgeList: MaybePromise<EdgeLike>[] = [];
                    let hasPromise = false;

                    function iterateNodesCallback(
                      maybeNode: any,
                      index: number
                    ) {
                      if (index === maxExpected) {
                        throw BREAK;
                      }
                      if (isPromiseLike(maybeNode)) {
                        hasPromise = true;
                        resolvedEdgeList.push(
                          maybeNode.then((node) => ({
                            cursor: cursorFromNode(node, formattedArgs, index),
                            node,
                          }))
                        );
                      } else {
                        resolvedEdgeList.push({
                          cursor: cursorFromNode(
                            index,
                            formattedArgs,
                            maybeNode
                          ),
                          node: maybeNode,
                        });
                      }
                    }

                    try {
                      forEach(nodes, iterateNodesCallback);
                    } catch (e) {
                      if (e !== BREAK) {
                        throw e;
                      }
                    }

                    if (hasPromise) {
                      return Promise.all(resolvedEdgeList);
                    }

                    return resolvedEdgeList as EdgeLike[];
                  });

                  return edges;
                }

                async function resolvePageInfo() {
                  const edges = await resolveEdges();
                  return {
                    hasNextPage: hasNextPageFn(args, edges),
                    hasPreviousPage: hasPreviousPageFn(args, edges),
                    startCursor: edges.length ? edges[0].cursor : null,
                    endCursor: edges.length
                      ? edges[edges.length - 1].cursor
                      : null,
                  };
                }

                return {
                  get nodes() {
                    return resolveNodes();
                  },
                  get edges() {
                    return resolveEdges();
                  },
                  get pageInfo() {
                    return resolvePageInfo();
                  },
                };
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

type PaginationArgs =
  | {
      first: number;
      after?: string;
      last?: never;
      before?: never;
    }
  | {
      last: number;
      before?: string;
      first?: number;
      after?: string;
    };

/**
 * A sensible default for determining "previous page".
 */
function defaultHasPreviousPage(args: PaginationArgs, edges: EdgeLike[]) {
  // If we're paginating forward, and we don't have an "after", we'll assume that we don't have
  // a previous page, otherwise we will assume we have one, unless the after cursor === "0".
  if (args.first) {
    if (args.after && args.after !== "0") {
      return true;
    }
    return false;
  }
  // If we're paginating backward, and there are as many results as we asked for, then we'll assume
  // that we have a previous page
  if (args.last) {
    return edges.length >= args.last;
  }
  // Otherwise, if neither first or last are provided, return false
  return false;
}

function defaultHasNextPage(args: PaginationArgs, edges: EdgeLike[]) {
  // If we're paginating forward, and we don't have an "after", we'll assume that we don't have
  // a previous page, otherwise we will assume we have one, unless the after cursor === "0".
  if (args.first) {
    return edges.length >= args.first;
  }
  // If we're paginating backward, and there are as many results as we asked for, then we'll assume
  // that we have a previous page
  if (args.last) {
    if (args.before && args.before !== "0") {
      return true;
    }
    return false;
  }
  // Otherwise, if neither first or last are provided, return false
  return false;
}

const CURSOR_PREFIX = "cursor:";

// Assumes we're only paginating in one direction.
function defaultCursorFromNode(node: any, args: PaginationArgs, index: number) {
  let cursorIndex = index;
  // If we're paginating forward, assume we're incrementing from the offset provided via "after",
  // e.g. [0...20] (first: 5, after: "cursor:5") -> [cursor:6, cursor:7, cursor:8, cursor:9, cursor: 10]
  if (args.first) {
    if (args.after) {
      const offset = parseInt(args.after, 10);
      cursorIndex = offset + index + 1;
    }
  }
  // If we're paginating backward, assume we're decrementing from the offset provided via "before",
  // e.g. [0...20] (last: 5, before: "cursor:20") -> [cursor:19, cursor:18, cursor:17, cursor:16, cursor:15]
  if (args.last) {
    if (args.before) {
      const offset = parseInt(args.before, 10);
      cursorIndex = offset - index - 1;
    }
  }
  return CURSOR_PREFIX + cursorIndex;
}

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
  pluginConfig: ConnectionPluginConfig,
  fieldConfig: any
) => {
  if (typeof fieldConfig.nodes !== "function") {
    console.error(
      new Error(
        `Nexus Connection Plugin: Missing nodes resolver property for ${typeName}.${fieldName}`
      )
    );
  }
  eachObj(pluginConfig.extendConnection || {}, (val, key) => {
    if (typeof fieldConfig[key] !== "function") {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing ${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
  eachObj(pluginConfig.extendEdge || {}, (val, key) => {
    if (
      !isObject(fieldConfig.edgeFields) ||
      typeof fieldConfig.edgeFields[key] !== "function"
    ) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing edgeFields.${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
  eachObj(pluginConfig.extendPageInfo || {}, (val, key) => {
    if (
      !isObject(fieldConfig.pageInfoFields) ||
      typeof fieldConfig.pageInfoFields[key] !== "function"
    ) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing pageInfoFields.${key} resolver property for ${typeName}.${fieldName}`
        )
      );
    }
  });
};
