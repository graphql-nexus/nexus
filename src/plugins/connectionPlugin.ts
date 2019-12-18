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
  MaybePromiseDeep,
} from "../typegenTypeHelpers";
import { FieldOutConfig } from "../definitions/definitionBlocks";
import { AllNexusOutputTypeDefs } from "../definitions/wrapping";
import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql";

export interface ConnectionPluginConfig {
  /**
   * The method name in the objectType definition block
   *
   * @default 'connectionField'
   */
  nexusFieldName?: string;
  /**
   * Whether to expose the "nodes" directly on the connection for convenience.
   *
   * @default false
   */
  includeNodesField?: boolean;
  /**
   * Any args to include by default on all connection fields,
   * in addition to the ones in the spec.
   *
   * @default null
   */
  additionalArgs?: ArgsRecord;
  /**
   * Set to true to disable forward pagination.
   *
   * @default false
   */
  disableForwardPagination?: boolean;
  /**
   * Set to true to disable backward pagination.
   *
   * @default false
   */
  disableBackwardPagination?: boolean;
  /**
   * Custom logic to validate the arguments.
   *
   * Defaults to requiring that either a `first` or `last` is provided, and
   * that after / before must be paired with `first` or `last`, respectively.
   */
  validateArgs?: (args: Record<string, any>, info: GraphQLResolveInfo) => void;
  /**
   * Default approach we use to transform a node into an unencoded cursor.
   *
   * Default is `cursor:${index}`
   *
   * @default "field"
   */
  cursorFromNode?: (
    node: any,
    args: PaginationArgs,
    index: number,
    allNodes: any[]
  ) => string;
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
   * Any additional fields to make available to the connection type,
   * beyond edges, pageInfo
   */
  extendConnection?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * Any additional fields to make available to the all pageInfo fields,
   * beyond hasNextPage, hasPreviousPage, startCursor, endCursor
   */
  extendPageInfo?: Record<string, Omit<FieldOutConfig<any, any>, "resolve">>;
  /**
   * If set to true, we will assume that a next/previous page exists
   * if the nodes length >= number requested for the first / last
   *
   * @default true
   */
  approximateNextPage?: boolean;
}

// Extract the node value from the connection for a given field.
export type NodeValue<
  TypeName extends string = any,
  FieldName extends string = any
> = Exclude<
  Exclude<ResultValue<TypeName, FieldName>["edges"], null | undefined>[number],
  null | undefined
>["node"];

export type ConnectionFieldConfig<
  TypeName extends string = any,
  FieldName extends string = any
> = {
  type: GetGen<"allOutputTypes", string> | AllNexusOutputTypeDefs;
  /**
   * Additional args to use for just this field
   */
  additionalArgs?: ArgsRecord;
  /**
   * Whether to inherit "additional args" if they exist on the plugin definition
   *
   * @default false
   */
  inheritAdditionalArgs?: boolean;
  /**
   * Approach we use to transform a node into a cursor.
   *
   * @default "nodeField"
   */
  cursorFromNode?: (
    node: NodeValue<TypeName, FieldName>,
    args: ArgsValue<TypeName, FieldName>,
    index: number,
    allNodes: NodeValue<TypeName, FieldName>[]
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
  /**
   * If set to true, we will assume that a next/previous page exists
   * if the nodes length >= number requested for the first / last
   *
   * @default true
   */
  approximateNextPage?: boolean;
} & (
  | {
      /**
       * Nodes should resolve to an Array, with a length of one greater than the direction you
       * are paginating.
       *
       * For example, if you're paginating forward, and assuming an Array with length 20:
       *
       * (first: 2) - [{id: 1}, {id: 2}, {id: 3}] - note: {id: 3} is extra
       *
       * (last: 2) - [{id: 18}, {id: 19}, {id: 20}] - note {id: 18} is extra
       *
       * We will then slice the array in the direction we're iterating, and if there are more
       * than "N" results, we will assume there's a next page. If you set `assumeExactNodeCount: true`
       * in the config, we will assume that a next page exists if the length >= the node count.
       */
      nodes: (
        root: RootValue<TypeName>,
        args: ArgsValue<TypeName, FieldName>,
        ctx: GetGen<"context">,
        info: GraphQLResolveInfo
      ) => Array<NodeValue<TypeName, FieldName>>;

      // resolve XOR nodes
      resolve?: never;
    }
  | {
      /**
       * Implement the full resolve, including `edges` and `pageInfo`. Useful for more complex
       * pagination cases, where you may want to use utilities from other libraries like
       * GraphQL Relay JS, and only use Nexus for the construction and type-safety:
       *
       * https://github.com/graphql/graphql-relay-js
       */
      resolve: (
        root: RootValue<TypeName>,
        args: ArgsValue<TypeName, FieldName>,
        ctx: GetGen<"context">,
        info: GraphQLResolveInfo
      ) =>
        | MaybePromise<ResultValue<TypeName, FieldName>>
        | MaybePromiseDeep<ResultValue<TypeName, FieldName>>;

      // resolve XOR nodes
      nodes?: never;
    }
);

const ForwardPaginateArgs = {
  first: intArg({
    nullable: true,
    description: "Returns the first n elements from the list.",
  }),
  after: stringArg({
    nullable: true,
    description:
      "Returns the elements in the list that come after the specified cursor",
  }),
};

const BackwardPaginateArgs = {
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

export type ConnectionNodesResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<Array<NodeValue<TypeName, FieldName>>>;

// Used for type-safe extensions to pageInfo
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

type EdgeLike = { cursor: string; node: any };

export const connectionPlugin = (
  connectionPluginConfig?: ConnectionPluginConfig
) => {
  const pluginConfig: ConnectionPluginConfig = { ...connectionPluginConfig };

  // Define the plugin with the appropriate configuration.
  return plugin({
    name: "ConnectionPlugin",
    fieldDefTypes: [
      printedGenTypingImport({
        module: "nexus",
        bindings: ["core", "connectionPluginCore"],
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
        extendConnection: pluginExtendConnection,
        extendEdge: pluginExtendEdge,
        extendPageInfo: pluginExtendPageInfo,
        includeNodesField = false,
        validateArgs = defaultValidateArgs,
        nexusFieldName = "connectionField",
      } = pluginConfig;

      // If to add fields to every connection, we require the resolver be defined on the
      // field definition.
      if (pluginExtendConnection) {
        eachObj(pluginExtendConnection, (val, key) => {
          dynamicConfig.push(
            `${key}: core.SubFieldResolver<TypeName, FieldName, "${key}">`
          );
        });
      }

      if (pluginExtendEdge) {
        const edgeFields = mapObj(
          pluginExtendEdge,
          (val, key) =>
            `${key}: connectionPluginCore.EdgeFieldResolver<TypeName, FieldName, "${key}">`
        );
        dynamicConfig.push(`edgeFields: { ${edgeFields.join(", ")} }`);
      }

      if (pluginExtendPageInfo) {
        const pageInfoFields = mapObj(
          pluginExtendPageInfo,
          (val, key) =>
            `${key}: connectionPluginCore.PageInfoFieldResolver<TypeName, FieldName, "${key}">`
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
            config: connectionPluginCore.ConnectionFieldConfig<TypeName, FieldName> & ${printedDynamicConfig}
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
                      nullable: true,
                      list: [false],
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

                    if (pluginExtendConnection) {
                      eachObj(pluginExtendConnection, (val, key) => {
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
                    });

                    t2.field("node", {
                      type: targetType,
                      description:
                        "https://facebook.github.io/relay/graphql/connections.htm#sec-Node",
                    });

                    if (pluginExtendEdge) {
                      eachObj(pluginExtendEdge, (val, key) => {
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
                      description: `hasNextPage is used to indicate whether more edges exist following the set defined by the clients arguments.`,
                    });
                    t2.boolean("hasPreviousPage", {
                      nullable: false,
                      description: `hasPreviousPage is used to indicate whether more edges exist prior to the set defined by the clients arguments.`,
                    });

                    t2.string("startCursor", {
                      nullable: true,
                      description: `The cursor corresponding to the first nodes in edges. Null if the connection is empty.`,
                    });
                    t2.string("endCursor", {
                      nullable: true,
                      description: `The cursor corresponding to the last nodes in edges. Null if the connection is empty.`,
                    });

                    if (pluginExtendPageInfo) {
                      eachObj(pluginExtendPageInfo, (val, key) => {
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
            const { disableBackwardPagination, disableForwardPagination } = {
              ...pluginConfig,
              ...fieldConfig,
            };

            let specArgs = {};
            if (disableForwardPagination !== true) {
              specArgs = { ...ForwardPaginateArgs };
            }
            if (disableBackwardPagination !== true) {
              specArgs = { ...specArgs, ...BackwardPaginateArgs };
            }

            // If we have additional args,

            let fieldAdditionalArgs = {};
            if (fieldConfig.additionalArgs) {
              if (additionalArgs && fieldConfig.inheritAdditionalArgs) {
                fieldAdditionalArgs = {
                  ...additionalArgs,
                };
              }
              fieldAdditionalArgs = {
                ...fieldConfig.additionalArgs,
              };
            } else if (additionalArgs) {
              fieldAdditionalArgs = { ...additionalArgs };
            }

            const fieldArgs = {
              ...fieldAdditionalArgs,
              ...specArgs,
            };

            const resolveFn = fieldConfig.resolve
              ? fieldConfig.resolve
              : makeResolveFn(pluginConfig, fieldConfig);

            // Add the field to the type.
            t.field(fieldName, {
              ...fieldConfig,
              args: fieldArgs,
              type: connectionName,
              resolve(root, args: PaginationArgs, ctx, info) {
                validateArgs(args, info);
                return resolveFn(root, args, ctx, info);
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

export function makeResolveFn(
  pluginConfig: ConnectionPluginConfig,
  fieldConfig: ConnectionFieldConfig
): GraphQLFieldResolver<any, any, any> {
  const mergedConfig = { ...pluginConfig, ...fieldConfig };
  return (root, args: PaginationArgs, ctx, info) => {
    const {
      cursorFromNode = defaultCursorFromNode,
      nodes: nodesResolve,
    } = fieldConfig;
    const {
      decodeCursor = base64Decode,
      encodeCursor = base64Encode,
    } = pluginConfig;
    const { approximateNextPage = true } = mergedConfig;
    if (!nodesResolve) {
      console.error(
        `Missing resolve or nodes field for Connection ${info.parentType.name}.${info.fieldName}`
      );
      return null;
    }

    const formattedArgs = { ...args };

    if (args.before) {
      formattedArgs.before = decodeCursor(args.before).replace(
        CURSOR_PREFIX,
        ""
      );
    }
    if (args.after) {
      formattedArgs.after = decodeCursor(args.after).replace(CURSOR_PREFIX, "");
    }

    // Local variable to cache the execution of fetching the nodes,
    // which is needed for all fields.
    let cachedNodes: Promise<Array<any>>;
    let cachedEdges: Promise<Array<EdgeLike | null> | null>;

    const resolveNodes = () => {
      if (cachedNodes !== undefined) {
        return cachedNodes;
      }
      cachedNodes = Promise.resolve(
        nodesResolve(root, formattedArgs, ctx, info) || null
      );
      return cachedNodes.then((allNodes) =>
        allNodes ? Array.from(allNodes) : allNodes
      );
    };

    const resolveEdges = () => {
      if (cachedEdges !== undefined) {
        return cachedEdges;
      }

      cachedEdges = resolveNodes().then((nodes) => {
        if (!nodes) {
          return null;
        }

        const resolvedEdgeList: MaybePromise<EdgeLike>[] = [];
        let hasPromise = false;

        iterateNodes(nodes, args, (maybeNode, i) => {
          if (isPromiseLike(maybeNode)) {
            hasPromise = true;
            resolvedEdgeList.push(
              maybeNode.then((node) => {
                const rawCursor = cursorFromNode(
                  maybeNode,
                  formattedArgs,
                  i,
                  nodes
                );
                return {
                  cursor: encodeCursor(rawCursor),
                  node,
                };
              })
            );
          } else {
            const rawCursor = cursorFromNode(
              maybeNode,
              formattedArgs,
              i,
              nodes
            );
            resolvedEdgeList.push({
              cursor: encodeCursor(rawCursor),
              node: maybeNode,
            });
          }
        });

        if (hasPromise) {
          return Promise.all(resolvedEdgeList);
        }

        return resolvedEdgeList as EdgeLike[];
      });

      return cachedEdges;
    };

    const resolvePageInfo = async () => {
      const [nodes, edges] = await Promise.all([
        resolveNodes(),
        resolveEdges(),
      ]);
      return {
        hasNextPage: edges
          ? defaultHasNextPage(args, edges, nodes, approximateNextPage)
          : false,
        hasPreviousPage: edges
          ? defaultHasPreviousPage(args, edges, nodes, approximateNextPage)
          : false,
        startCursor: edges?.[0]?.cursor ? edges[0].cursor : null,
        endCursor: edges?.[edges.length - 1]?.cursor ?? null,
      };
    };

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
  };
}

function iterateNodes(
  nodes: any[],
  args: PaginationArgs,
  cb: (node: any, i: number) => void
) {
  // If we want the first N of an array of nodes, it's pretty straightforward.
  if (args.first) {
    for (let i = 0; i < args.first; i++) {
      const nextNode = nodes[i];
      if (nextNode !== undefined) {
        cb(nextNode, i);
      }
    }
  } else if (args.last) {
    for (let i = 0; i < args.last; i++) {
      const idx = nodes.length - args.last + i;
      const nextNode = nodes[idx];
      if (nextNode !== undefined) {
        cb(nextNode, i);
      }
    }
  }
}

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

function defaultHasNextPage(
  args: PaginationArgs,
  edges: Array<EdgeLike | null>,
  nodes: any[] | null,
  approximateNextPage: boolean
) {
  // If we're paginating forward, and we don't have an "after", we'll assume that we don't have
  // a previous page, otherwise we will assume we have one, unless the after cursor === "0".
  if (args.first) {
    if (approximateNextPage) {
      return edges.length >= args.first;
    } else {
      return nodes ? nodes.length > args.first : false;
    }
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

/**
 * A sensible default for determining "previous page".
 */
function defaultHasPreviousPage(
  args: PaginationArgs,
  edges: Array<EdgeLike | null>,
  nodes: any[] | null,
  approximateNextPage: boolean
) {
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
    if (approximateNextPage) {
      return edges.length >= args.last;
    }
    return nodes ? nodes.length > args.last : false;
  }
  // Otherwise, if neither first or last are provided, return false
  return false;
}

const CURSOR_PREFIX = "cursor:";

// Assumes we're only paginating in one direction.
function defaultCursorFromNode(
  node: any,
  args: PaginationArgs,
  index: number,
  allNodes: any[]
) {
  let cursorIndex = index;
  // If we're paginating forward, assume we're incrementing from the offset provided via "after",
  // e.g. [0...20] (first: 5, after: "cursor:5") -> [cursor:6, cursor:7, cursor:8, cursor:9, cursor: 10]
  if (args.first) {
    if (args.after) {
      const offset = parseInt(args.after, 10);
      cursorIndex = offset + index + 1;
    }
  }

  // If we're paginating backward, assume we're working backward from the assumed length
  // e.g. [0...20] (last: 5, before: "cursor:20") -> [cursor:15, cursor:16, cursor:17, cursor:18, cursor:19]
  if (args.last) {
    if (args.before) {
      const offset = parseInt(args.before, 10);
      cursorIndex = offset - args.last + index;
    }
  }
  return `${CURSOR_PREFIX}${cursorIndex}`;
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
  if (
    typeof fieldConfig.nodes !== "function" &&
    typeof fieldConfig.resolve !== "function"
  ) {
    console.error(
      new Error(
        `Nexus Connection Plugin: Missing nodes or resolve property for ${typeName}.${fieldName}`
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

function defaultValidateArgs(
  args: Record<string, any> = {},
  info: GraphQLResolveInfo
) {
  if (!args.first && !args.last) {
    throw new Error(
      `The ${getPath(info)} connection requires a "first" or "last" argument`
    );
  }
  if (args.first && args.last) {
    throw new Error(
      `The ${getPath(
        info
      )} connection requires a "first" or "last" argument, not both`
    );
  }
  if (args.first && args.before) {
    throw new Error(
      `The ${getPath(
        info
      )} connection does not allow a "before" argument with "first"`
    );
  }
  if (args.last && args.after) {
    throw new Error(
      `The ${getPath(
        info
      )} connection does not allow a "last" argument with "after"`
    );
  }
}

function getPath(info: GraphQLResolveInfo) {
  let fullPath = info.path.key;
  let prev = info.path.prev;
  while (prev) {
    fullPath = `${prev.key}.${fullPath}`;
    prev = prev.prev;
  }
  return fullPath;
}
