import { defaultFieldResolver, GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import { ArgsRecord, intArg, stringArg } from '../definitions/args'
import type {
  CommonFieldConfig,
  FieldOutConfig,
  FieldOutConfigWithName,
} from '../definitions/definitionBlocks'
import { NexusNonNullDef, nonNull } from '../definitions/nonNull'
import { NexusNullDef, nullable } from '../definitions/nullable'
import { ObjectDefinitionBlock, objectType } from '../definitions/objectType'
import {
  AllNexusNamedOutputTypeDefs,
  AllNexusOutputTypeDefs,
  applyNexusWrapping,
} from '../definitions/wrapping'
import type { NonNullConfig } from '../definitions/_types'
import { dynamicOutputMethod } from '../dynamicMethod'
import { completeValue, plugin } from '../plugin'
import type {
  ArgsValue,
  FieldTypeName,
  GetGen,
  MaybePromise,
  MaybePromiseDeep,
  ResultValue,
  SourceValue,
} from '../typegenTypeHelpers'
import type { MaybePromiseLike } from '../typeHelpersInternal'
import { eachObj, getOwnPackage, isPromiseLike, mapObj, pathToArray, printedGenTypingImport } from '../utils'

export interface ConnectionPluginConfig {
  /**
   * The method name in the objectType definition block
   *
   * @default 'connectionField'
   */
  nexusFieldName?: string
  /**
   * Whether to expose the "nodes" directly on the connection for convenience.
   *
   * @default false
   */
  includeNodesField?: boolean
  /**
   * Any args to include by default on all connection fields, in addition to the ones in the spec.
   *
   * @default null
   */
  additionalArgs?: ArgsRecord
  /**
   * Set to true to disable forward pagination.
   *
   * @default false
   */
  disableForwardPagination?: boolean
  /**
   * Set to true to disable backward pagination.
   *
   * @default false
   */
  disableBackwardPagination?: boolean
  /**
   * Custom logic to validate the arguments.
   *
   * Defaults to requiring that either a `first` or `last` is provided, and that after / before must be paired
   * with `first` or `last`, respectively.
   */
  validateArgs?: (args: Record<string, any>, info: GraphQLResolveInfo, root: unknown, ctx: unknown) => void
  /**
   * If disableForwardPagination or disableBackwardPagination are set to true, we require the `first` or
   * `last` field as needed. Defaults to true, setting this to false will disable this behavior and make the
   * field nullable.
   */
  strictArgs?: boolean
  /**
   * Default approach we use to transform a node into an unencoded cursor.
   *
   * Default is `cursor:${index}`
   *
   * @default field
   */
  cursorFromNode?: (
    node: any,
    args: PaginationArgs,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo,
    forCursor: { index: number; nodes: any[] }
  ) => string | Promise<string>
  /**
   * Override the default behavior of determining hasNextPage / hasPreviousPage. Usually needed when
   * customizing the behavior of `cursorFromNode`
   */
  pageInfoFromNodes?: (
    allNodes: any[],
    args: PaginationArgs,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ) => MaybePromise<{ hasNextPage: boolean; hasPreviousPage: boolean }>
  /** Conversion from a cursor string into an opaque token. Defaults to base64Encode(string) */
  encodeCursor?: (value: string) => string
  /** Conversion from an opaque token into a cursor string. Defaults to base64Decode(string) */
  decodeCursor?: (cursor: string) => string
  /** Extend *all* edges to include additional fields, beyond cursor and node */
  extendEdge?: Record<
    string,
    Omit<FieldOutConfig<any, any>, 'resolve'> & {
      /**
       * Set requireResolver to false if you have already resolved this information during the resolve of the
       * edges in the parent resolve method
       *
       * @default true
       */
      requireResolver?: boolean
    }
  >
  /**
   * Any additional fields to make available to the connection type, beyond edges / pageInfo / nodes.
   *
   * Any fields defined extended on the Connection type will automatically receive the args from the
   * connection. If the field also defines args, they will be merged with the args of the connection, with the
   * extension's field args taking precedence if there is a conflict.
   */
  extendConnection?: Record<
    string,
    Omit<FieldOutConfig<any, any>, 'resolve'> & {
      /**
       * Set requireResolver to false if you have already resolved this information during the resolve of the
       * edges in the parent resolve method
       *
       * @default true
       */
      requireResolver?: boolean
    }
  >
  /** Allows specifying a custom name for connection types. */
  getConnectionName?(filedName: string, parentTypeName: string): string
  /** Allows specifying a custom name for edge types. */
  getEdgeName?(filedName: string, parentTypeName: string): string
  /** Prefix for the Connection / Edge type */
  typePrefix?: string
  /**
   * The path to the nexus package for typegen.
   *
   * This setting is only necessary when nexus is being wrapped by another library/framework such that `nexus`
   * is not expected to be a direct dependency at the application level.
   *
   * @default 'nexus'
   */
  nexusSchemaImportId?: string
  /**
   * Configures the default "nonNullDefaults" settings for any connection types created globally by this
   * config / connection field.
   */
  nonNullDefaults?: NonNullConfig
  /** Allows specifying a custom cursor type, as the name of a scalar */
  cursorType?:
    | GetGen<'scalarNames'>
    | NexusNullDef<GetGen<'scalarNames'>>
    | NexusNonNullDef<GetGen<'scalarNames'>>
}

// Extract the node value from the connection for a given field.
export type NodeValue<TypeName extends string = any, FieldName extends string = any> = SourceValue<
  EdgeTypeLookup<TypeName, FieldName>
>['node']

export type ConnectionFieldConfig<TypeName extends string = any, FieldName extends string = any> = {
  type: GetGen<'allOutputTypes', string> | AllNexusNamedOutputTypeDefs
  /**
   * Whether the connection field can be null
   *
   * @default (depends on whether nullability is configured in type or schema)
   */
  nullable?: boolean
  /**
   * Additional args to include for just this field
   *
   * @example
   *   additionalArgs: {
   *     orderBy: arg({ type: nonNull(SortOrderEnum) })
   *   }
   */
  additionalArgs?: ArgsRecord
  /**
   * Whether to inherit "additional args" if they exist on the plugin definition
   *
   * @default false
   */
  inheritAdditionalArgs?: boolean
  /**
   * Approach we use to transform a node into a cursor.
   *
   * @default nodeField
   */
  cursorFromNode?: (
    node: NodeValue<TypeName, FieldName>,
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo,
    forCursor: { index: number; nodes: NodeValue<TypeName, FieldName>[] }
  ) => string | Promise<string>
  /**
   * Override the default behavior of determining hasNextPage / hasPreviousPage. Usually needed when
   * customizing the behavior of `cursorFromNode`
   */
  pageInfoFromNodes?: (
    nodes: NodeValue<TypeName, FieldName>[],
    args: ArgsValue<TypeName, FieldName>,
    ctx: GetGen<'context'>,
    info: GraphQLResolveInfo
  ) => MaybePromise<{ hasNextPage: boolean; hasPreviousPage: boolean }>
  /**
   * Whether the field allows for backward pagination
   *
   * @see https://relay.dev/graphql/connections.htm#sec-Backward-pagination-arguments
   */
  disableForwardPagination?: boolean
  /**
   * Whether the field allows for backward pagination
   *
   * @see https://relay.dev/graphql/connections.htm#sec-Forward-pagination-arguments
   */
  disableBackwardPagination?: boolean
  /**
   * If disableForwardPagination or disableBackwardPagination are set to true, we require the `first` or
   * `last` field as needed. Defaults to true, setting this to false will disable this behavior and make the
   * field nullable.
   */
  strictArgs?: boolean
  /**
   * Custom logic to validate the arguments.
   *
   * Defaults to requiring that either a `first` or `last` is provided, and that after / before must be paired
   * with `first` or `last`, respectively.
   */
  validateArgs?: (
    args: ArgsValue<TypeName, FieldName>,
    info: GraphQLResolveInfo,
    root: SourceValue<TypeName>,
    ctx: GetGen<'context'>
  ) => void
  /**
   * Dynamically adds additional fields to the current "connection" when it is defined. This will cause the
   * resulting type to be prefix'ed with the name of the type/field it is branched off of, so as not to
   * conflict with any non-extended connections.
   */
  extendConnection?: (def: ObjectDefinitionBlock<FieldTypeName<TypeName, FieldName>>) => void
  /**
   * Dynamically adds additional fields to the connection "edge" when it is defined. This will cause the
   * resulting type to be prefix'ed with the name of the type/field it is branched off of, so as not to
   * conflict with any non-extended connections.
   */
  extendEdge?: (
    def: ObjectDefinitionBlock<FieldTypeName<FieldTypeName<TypeName, FieldName>, 'edges'>>
  ) => void
  /** Allows specifying a custom name for connection types. */
  getConnectionName?(filedName: string, parentTypeName: string): string
  /** Allows specifying a custom name for edge types. */
  getEdgeName?(filedName: string, parentTypeName: string): string
  /** Configures the default "nonNullDefaults" for connection type generated for this connection */
  nonNullDefaults?: NonNullConfig
  /**
   * Allows specifying a custom cursor type, as the name of a scalar
   *
   * @example
   *   cursorType: 'CustomString'
   */
  cursorType?:
    | GetGen<'scalarNames'>
    | NexusNullDef<GetGen<'scalarNames'>>
    | NexusNonNullDef<GetGen<'scalarNames'>>
  /**
   * Defined automatically if you have extended the connectionPlugin globally
   *
   * If you wish to set "requireResolver" to false on the edge field definition in the connection plugin
   */
  edgeFields?: unknown
} & (
  | {
      /**
       * Nodes should resolve to an Array, with a length of one greater than the direction you are paginating.
       *
       * For example, if you're paginating forward, and assuming an Array with length 20:
       *
       * (first: 2) - [{id: 1}, {id: 2}, {id: 3}] - note: {id: 3} is extra
       *
       * (last: 2) - [{id: 18}, {id: 19}, {id: 20}] - note {id: 18} is extra
       *
       * We will then slice the array in the direction we're iterating, and if there are more than "N"
       * results, we will assume there's a next page. If you set `assumeExactNodeCount: true` in the config,
       * we will assume that a next page exists if the length >= the node count.
       */
      nodes: (
        root: SourceValue<TypeName>,
        args: ArgsValue<TypeName, FieldName>,
        ctx: GetGen<'context'>,
        info: GraphQLResolveInfo
      ) => MaybePromise<Array<NodeValue<TypeName, FieldName>>>

      // resolve XOR nodes
      resolve?: never
    }
  | {
      /**
       * Implement the full resolve, including `edges` and `pageInfo`. Useful in more complex pagination
       * cases, or if you want to use utilities from other libraries like GraphQL Relay JS, and only use Nexus
       * for the construction and type-safety:
       *
       * Https://github.com/graphql/graphql-relay-js
       */
      resolve: (
        root: SourceValue<TypeName>,
        args: ArgsValue<TypeName, FieldName>,
        ctx: GetGen<'context'>,
        info: GraphQLResolveInfo
      ) => MaybePromise<ResultValue<TypeName, FieldName>> | MaybePromiseDeep<ResultValue<TypeName, FieldName>>

      // resolve XOR nodes
      nodes?: never
    }
) &
  Pick<CommonFieldConfig, 'deprecation' | 'description'> &
  NexusGenPluginFieldConfig<TypeName, FieldName>

export const ForwardPaginateArgs = {
  first: nullable(intArg({ description: 'Returns the first n elements from the list.' })),
  after: nullable(
    stringArg({ description: 'Returns the elements in the list that come after the specified cursor' })
  ),
}

export const ForwardOnlyStrictArgs = {
  ...ForwardPaginateArgs,
  first: nonNull(intArg({ description: 'Returns the first n elements from the list.' })),
}

export const BackwardPaginateArgs = {
  last: nullable(intArg({ description: 'Returns the last n elements from the list.' })),
  before: nullable(
    stringArg({ description: 'Returns the elements in the list that come before the specified cursor' })
  ),
}

export const BackwardOnlyStrictArgs = {
  ...BackwardPaginateArgs,
  last: nonNull(intArg({ description: 'Returns the last n elements from the list.' })),
}

function base64Encode(str: string) {
  return Buffer.from(str, 'utf8').toString('base64')
}

function base64Decode(str: string) {
  return Buffer.from(str, 'base64').toString('utf8')
}

export type EdgeTypeLookup<TypeName extends string, FieldName extends string> = FieldTypeName<
  FieldTypeName<TypeName, FieldName>,
  'edges'
>

export type EdgeFieldResolver<TypeName extends string, FieldName extends string, EdgeField extends string> = (
  root: SourceValue<EdgeTypeLookup<TypeName, FieldName>>,
  args: ArgsValue<TypeName, FieldName> & ArgsValue<EdgeTypeLookup<TypeName, FieldName>, EdgeField>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<EdgeTypeLookup<TypeName, FieldName>, EdgeField>>

export type ConnectionFieldResolver<
  TypeName extends string,
  FieldName extends string,
  ConnectionFieldName extends string
> = (
  root: SourceValue<TypeName>,
  args: ArgsValue<FieldTypeName<TypeName, FieldName>, ConnectionFieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<FieldTypeName<TypeName, FieldName>, ConnectionFieldName>>

export type ConnectionNodesResolver<TypeName extends string, FieldName extends string> = (
  root: SourceValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<Array<NodeValue<TypeName, FieldName>>>

// Used for type-safe extensions to pageInfo
export type PageInfoFieldResolver<
  TypeName extends string,
  FieldName extends string,
  EdgeField extends string
> = (
  root: SourceValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<'context'>,
  info: GraphQLResolveInfo
) => MaybePromise<ResultValue<TypeName, FieldName>['pageInfo'][EdgeField]>

export type EdgeLike = { cursor: string | PromiseLike<string>; node: any }

export const connectionPlugin = (connectionPluginConfig?: ConnectionPluginConfig) => {
  const pluginConfig: ConnectionPluginConfig = { ...connectionPluginConfig }

  // Define the plugin with the appropriate configuration.

  return plugin({
    name: 'ConnectionPlugin',
    fieldDefTypes: [
      printedGenTypingImport({
        module: connectionPluginConfig?.nexusSchemaImportId ?? getOwnPackage().name,
        bindings: ['core', 'connectionPluginCore'],
      }),
    ],
    // Defines the field added to the definition block:
    // t.connectionField('users', {
    //   type: User
    // })
    onInstall(b) {
      let dynamicConfig = []

      const {
        additionalArgs = {},
        extendConnection: pluginExtendConnection,
        extendEdge: pluginExtendEdge,
        includeNodesField = false,
        nexusFieldName = 'connectionField',
      } = pluginConfig

      // If to add fields to every connection, we require the resolver be defined on the
      // field definition, unless fromResolve: true is passed in the config
      if (pluginExtendConnection) {
        eachObj(pluginExtendConnection, (val, key) => {
          dynamicConfig.push(
            `${key}${
              val.requireResolver === false ? '?:' : ':'
            } connectionPluginCore.ConnectionFieldResolver<TypeName, FieldName, "${key}">`
          )
        })
      }

      if (pluginExtendEdge) {
        const edgeFields = mapObj(
          pluginExtendEdge,
          (val, key) =>
            `${key}${
              val.requireResolver === false ? '?:' : ':'
            } connectionPluginCore.EdgeFieldResolver<TypeName, FieldName, "${key}">`
        )
        dynamicConfig.push(`edgeFields: { ${edgeFields.join(', ')} }`)
      }

      let printedDynamicConfig = ''
      if (dynamicConfig.length > 0) {
        printedDynamicConfig = ` & { ${dynamicConfig.join(', ')} }`
      }

      // Add the t.connectionField (or something else if we've changed the name)
      b.addType(
        dynamicOutputMethod({
          name: nexusFieldName,
          typeDescription: `
            Adds a Relay-style connection to the type, with numerous options for configuration

            @see https://nexusjs.org/docs/plugins/connection
          `,
          typeDefinition: `<FieldName extends string>(
      fieldName: FieldName,
      config: connectionPluginCore.ConnectionFieldConfig<TypeName, FieldName>${printedDynamicConfig}
    ): void`,
          factory({ typeName: parentTypeName, typeDef: t, args: factoryArgs, stage, builder, wrapping }) {
            const [fieldName, fieldConfig] = factoryArgs as [string, ConnectionFieldConfig]
            const targetType = fieldConfig.type

            /* istanbul ignore if */
            if (wrapping?.includes('List')) {
              throw new Error(`Cannot chain .list with connectionField (on ${parentTypeName}.${fieldName})`)
            }
            const { targetTypeName, connectionName, edgeName } = getTypeNames(
              fieldName,
              parentTypeName,
              fieldConfig,
              pluginConfig
            )

            if (stage === 'build') {
              assertCorrectConfig(parentTypeName, fieldName, pluginConfig, fieldConfig)
            }

            // Add the "Connection" type to the schema if it doesn't exist already
            if (!b.hasType(connectionName)) {
              b.addType(
                objectType({
                  name: connectionName,
                  definition(t2) {
                    t2.list.field('edges', {
                      type: edgeName as any,
                      description: `https://facebook.github.io/relay/graphql/connections.htm#sec-Edge-Types`,
                    })
                    t2.nonNull.field('pageInfo', {
                      type: 'PageInfo' as any,
                      description: `https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo`,
                    })
                    if (includeNodesField) {
                      t2.list.field('nodes', {
                        type: targetType,
                        description: `Flattened list of ${targetTypeName} type`,
                      })
                    }
                    if (pluginExtendConnection) {
                      eachObj(pluginExtendConnection, (extensionFieldConfig, extensionFieldName) => {
                        t2.field(extensionFieldName, extensionFieldConfig)
                      })
                    }
                    provideSourceAndArgs(t2, () => {
                      if (fieldConfig.extendConnection instanceof Function) {
                        fieldConfig.extendConnection(t2)
                      }
                    })
                  },
                  nonNullDefaults: fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
                })
              )
            }

            // Add the "Edge" type to the schema if it doesn't exist already
            if (!b.hasType(edgeName)) {
              b.addType(
                objectType({
                  name: edgeName,
                  definition(t2) {
                    t2.field('cursor', {
                      type: cursorType ?? nonNull('String'),
                      description: 'https://facebook.github.io/relay/graphql/connections.htm#sec-Cursor',
                    })
                    t2.field('node', {
                      type: targetType,
                      description: 'https://facebook.github.io/relay/graphql/connections.htm#sec-Node',
                    })
                    if (pluginExtendEdge) {
                      eachObj(pluginExtendEdge, (val, key) => {
                        t2.field(key, val)
                      })
                    }
                    provideArgs(t2, () => {
                      if (fieldConfig.extendEdge instanceof Function) {
                        fieldConfig.extendEdge(t2)
                      }
                    })
                  },
                  nonNullDefaults: fieldConfig.nonNullDefaults ?? pluginConfig.nonNullDefaults,
                })
              )
            }

            // Add the "PageInfo" type to the schema if it doesn't exist already
            if (!b.hasType('PageInfo')) {
              b.addType(
                objectType({
                  name: 'PageInfo',
                  description:
                    'PageInfo cursor, as defined in https://facebook.github.io/relay/graphql/connections.htm#sec-undefined.PageInfo',
                  definition(t2) {
                    t2.nonNull.field('hasNextPage', {
                      type: 'Boolean',
                      description: `Used to indicate whether more edges exist following the set defined by the clients arguments.`,
                    })
                    t2.nonNull.field('hasPreviousPage', {
                      type: 'Boolean',
                      description: `Used to indicate whether more edges exist prior to the set defined by the clients arguments.`,
                    })
                    t2.nullable.field('startCursor', {
                      type: 'String',
                      description: `The cursor corresponding to the first nodes in edges. Null if the connection is empty.`,
                    })
                    t2.nullable.field('endCursor', {
                      type: 'String',
                      description: `The cursor corresponding to the last nodes in edges. Null if the connection is empty.`,
                    })
                  },
                })
              )
            }
            const {
              disableBackwardPagination,
              disableForwardPagination,
              validateArgs = defaultValidateArgs,
              strictArgs = true,
              cursorType,
            } = {
              ...pluginConfig,
              ...fieldConfig,
            }

            let specArgs = {}
            if (disableForwardPagination !== true && disableBackwardPagination !== true) {
              specArgs = { ...ForwardPaginateArgs, ...BackwardPaginateArgs }
            } else if (disableForwardPagination !== true) {
              specArgs = strictArgs ? { ...ForwardOnlyStrictArgs } : { ...ForwardPaginateArgs }
            } else if (disableBackwardPagination !== true) {
              specArgs = strictArgs ? { ...BackwardOnlyStrictArgs } : { ...BackwardPaginateArgs }
            }

            // If we have additional args,

            let fieldAdditionalArgs = {}
            if (fieldConfig.additionalArgs) {
              if (additionalArgs && fieldConfig.inheritAdditionalArgs) {
                fieldAdditionalArgs = {
                  ...additionalArgs,
                  ...fieldConfig.additionalArgs,
                }
              } else {
                fieldAdditionalArgs = {
                  ...fieldConfig.additionalArgs,
                }
              }
            } else if (additionalArgs) {
              fieldAdditionalArgs = { ...additionalArgs }
            }

            const fieldArgs = {
              ...fieldAdditionalArgs,
              ...specArgs,
            }

            let resolveFn: GraphQLFieldResolver<any, any>
            if (fieldConfig.resolve) {
              if (includeNodesField) {
                resolveFn = (root, args, ctx, info) => {
                  return completeValue(fieldConfig.resolve(root, args, ctx, info), (val) => {
                    if (val && val.nodes === undefined) {
                      return withArgs(args, {
                        get nodes() {
                          return completeValue(val.edges, (edges) => edges.map((edge: any) => edge.node))
                        },
                        ...val,
                      })
                    }
                    return withArgs(args, { ...val })
                  })
                }
              } else {
                resolveFn = fieldConfig.resolve
              }
            } else {
              resolveFn = makeResolveFn(pluginConfig, fieldConfig)
            }

            let wrappedConnectionName: AllNexusOutputTypeDefs | string = connectionName
            if (wrapping) {
              if (typeof fieldConfig.nullable === 'boolean') {
                throw new Error(
                  '[connectionPlugin]: You cannot chain .null/.nonNull and also set the nullable in the connectionField definition.'
                )
              }
              wrappedConnectionName = applyNexusWrapping(connectionName, wrapping)
            } else {
              if (fieldConfig.nullable === true) {
                wrappedConnectionName = nullable(wrappedConnectionName as any)
              } else if (fieldConfig.nullable === false) {
                wrappedConnectionName = nonNull(wrappedConnectionName as any)
              }
            }
            // Add the field to the type.
            t.field(fieldName, {
              ...nonConnectionFieldProps(fieldConfig),
              args: fieldArgs,
              type: wrappedConnectionName as any,
              resolve(root, args: PaginationArgs, ctx, info) {
                // TODO(2.0): Maybe switch the arguments around here to be consistent w/ resolver (breaking change)?
                validateArgs(args, info, root, ctx)
                return resolveFn(root, args, ctx, info)
              },
            })
          },
        })
      )
    },
  })
}

// Extract all of the non-connection related field config we may want to apply for plugin purposes
function nonConnectionFieldProps(fieldConfig: ConnectionFieldConfig) {
  const {
    additionalArgs,
    cursorFromNode,
    disableBackwardPagination,
    disableForwardPagination,
    extendConnection,
    extendEdge,
    inheritAdditionalArgs,
    nodes,
    pageInfoFromNodes,
    resolve,
    type,
    validateArgs,
    strictArgs,
    nullable,
    ...rest
  } = fieldConfig
  return rest
}

export function makeResolveFn(
  pluginConfig: ConnectionPluginConfig,
  fieldConfig: ConnectionFieldConfig
): GraphQLFieldResolver<any, any, any> {
  const mergedConfig = { ...pluginConfig, ...fieldConfig }
  return (root, args: PaginationArgs, ctx, info) => {
    const { nodes: nodesResolve } = fieldConfig
    const { decodeCursor = base64Decode, encodeCursor = base64Encode } = pluginConfig
    const { pageInfoFromNodes = defaultPageInfoFromNodes, cursorFromNode = defaultCursorFromNode } =
      mergedConfig
    if (!nodesResolve) {
      return null
    }

    const formattedArgs = { ...args }

    if (args.before) {
      formattedArgs.before = decodeCursor(args.before).replace(CURSOR_PREFIX, '')
    }
    if (args.after) {
      formattedArgs.after = decodeCursor(args.after).replace(CURSOR_PREFIX, '')
    }

    if (args.last && !args.before && cursorFromNode === defaultCursorFromNode) {
      throw new Error(`Cannot paginate backward without a "before" cursor by default.`)
    }

    // Local variable to cache the execution of fetching the nodes,
    // which is needed for all fields.
    let cachedNodes: MaybePromiseLike<Array<any>>
    let cachedEdges: MaybePromiseLike<{
      edges: EdgeLike[]
      nodes: any[]
    }>
    let hasPromise = false

    // Get all the nodes, before any pagination slicing
    const resolveAllNodes = () => {
      if (cachedNodes !== undefined) {
        return cachedNodes
      }

      cachedNodes = completeValue(nodesResolve(root, formattedArgs, ctx, info) ?? null, (allNodes) => {
        return allNodes ? Array.from(allNodes) : allNodes
      })

      return cachedNodes
    }

    const resolveEdgesAndNodes = () => {
      if (cachedEdges !== undefined) {
        return cachedEdges
      }

      cachedEdges = completeValue(resolveAllNodes(), (allNodes) => {
        if (!allNodes) {
          const arrPath = JSON.stringify(pathToArray(info.path))
          console.warn(
            `You resolved null/undefined from nodes() at path ${arrPath}, this is likely an error. Return an empty array to suppress this warning.`
          )
          return { edges: [], nodes: [] }
        }

        const resolvedEdgeList: MaybePromise<EdgeLike>[] = []
        const resolvedNodeList: any[] = []

        iterateNodes(allNodes, args, (maybeNode, i) => {
          if (isPromiseLike(maybeNode)) {
            hasPromise = true
            resolvedNodeList.push(maybeNode)
            resolvedEdgeList.push(
              maybeNode.then((node) => {
                return completeValue<string, any>(
                  cursorFromNode(maybeNode, formattedArgs, ctx, info, {
                    index: i,
                    nodes: allNodes,
                  }),
                  (rawCursor) =>
                    wrapEdge(pluginConfig, fieldConfig, formattedArgs, {
                      cursor: encodeCursor(rawCursor),
                      node,
                    })
                )
              })
            )
          } else {
            resolvedNodeList.push(maybeNode)
            resolvedEdgeList.push(
              wrapEdge(pluginConfig, fieldConfig, formattedArgs, {
                node: maybeNode,
                cursor: completeValue(
                  cursorFromNode(maybeNode, formattedArgs, ctx, info, {
                    index: i,
                    nodes: allNodes,
                  }),
                  (rawCursor) => encodeCursor(rawCursor)
                ),
              })
            )
          }
        })

        if (hasPromise) {
          return Promise.all([Promise.all(resolvedEdgeList), Promise.all(resolvedNodeList)]).then(
            ([edges, nodes]) => ({ edges, nodes })
          )
        }

        return {
          nodes: resolvedNodeList,
          // todo find type-safe way of doing this
          edges: resolvedEdgeList as EdgeLike[],
        }
      })

      return cachedEdges
    }

    const resolvePageInfo = () => {
      return completeValue(resolveAllNodes(), (allNodes) =>
        completeValue(resolveEdgesAndNodes(), ({ edges }) =>
          completeValue(
            allNodes
              ? pageInfoFromNodes(allNodes, args, ctx, info)
              : {
                  hasNextPage: false,
                  hasPreviousPage: false,
                },
            (basePageInfo) => ({
              ...basePageInfo,
              startCursor: edges?.[0]?.cursor ? edges[0].cursor : null,
              endCursor: edges?.[edges.length - 1]?.cursor ?? null,
            })
          )
        )
      )
    }

    const connectionResult = withSource(root, formattedArgs, {
      get nodes() {
        return completeValue(resolveEdgesAndNodes(), (o) => o.nodes)
      },
      get edges() {
        return completeValue(resolveEdgesAndNodes(), (o) => o.edges)
      },
      get pageInfo() {
        return resolvePageInfo()
      },
    })

    if (pluginConfig.extendConnection) {
      Object.keys(pluginConfig.extendConnection).forEach((connectionField) => {
        const resolve = (fieldConfig as any)[connectionField] ?? defaultFieldResolver
        Object.defineProperty(connectionResult, connectionField, {
          value: (args: object, ctx: unknown, info: GraphQLResolveInfo) => {
            return resolve(root, { ...formattedArgs, ...args }, ctx, info)
          },
        })
      })
    }

    return connectionResult
  }
}

function wrapEdge<T extends object>(
  pluginConfig: ConnectionPluginConfig,
  fieldConfig: ConnectionFieldConfig,
  formattedArgs: PaginationArgs,
  edgeParentType: T
): T {
  const edge = withArgs(formattedArgs, edgeParentType)
  if (pluginConfig.extendEdge) {
    Object.keys(pluginConfig.extendEdge).forEach((edgeField) => {
      const resolve = (fieldConfig as any).edgeFields?.[edgeField] ?? defaultFieldResolver
      Object.defineProperty(edge, edgeField, {
        value: (args: object, ctx: unknown, info: GraphQLResolveInfo) => {
          return resolve(edge, { ...formattedArgs, ...args }, ctx, info)
        },
      })
    })
  }
  return edge
}

/**
 * Adds __connectionArgs to the object representing the Connection type, so it can be accessed by other fields
 * in the top level
 *
 * @param args
 * @param connectionParentType
 */
function withArgs<T extends object>(args: PaginationArgs, connectionParentType: T): T {
  Object.defineProperty(connectionParentType, '__connectionArgs', {
    value: args,
    enumerable: false,
  })
  return connectionParentType
}

/**
 * Adds __connectionSource to the object representing the Connection type, so it can be accessed by other
 * fields in the top level
 *
 * @param args
 * @param connectionParentType
 */
function withSource<T extends object>(source: unknown, args: PaginationArgs, connectionParentType: T): T {
  Object.defineProperty(connectionParentType, '__connectionSource', {
    value: source,
    enumerable: false,
  })
  return withArgs(args, connectionParentType)
}

/** Takes __connectionArgs from the source object and merges with the args provided by the */
function mergeArgs(obj: object, fieldArgs: ArgsValue<any, any>): ArgsValue<any, any> {
  return { ...(obj as any).__connectionArgs, ...fieldArgs }
}

/**
 * Takes a "builder", and a function which takes a builder, and ensures that all fields defined within that
 * function invocation are provided the __connectionArgs defined by the connection
 */
function provideArgs(block: ObjectDefinitionBlock<any>, fn: () => void) {
  const fieldDef = block.field
  block.field = function (
    ...args:
      | [name: string, config: FieldOutConfig<any, string>]
      | [config: FieldOutConfigWithName<any, string>]
  ) {
    let config = args.length === 2 ? { name: args[0], ...args[1] } : args[0]

    const { resolve = defaultFieldResolver } = config

    fieldDef.call(this, {
      ...config,
      resolve(root, args, ctx, info) {
        return resolve(root, mergeArgs(root, args), ctx, info)
      },
    })
  }
  fn()
  block.field = fieldDef
}

function provideSourceAndArgs(block: ObjectDefinitionBlock<any>, fn: () => void) {
  const fieldDef = block.field
  block.field = function (
    ...args:
      | [name: string, config: FieldOutConfig<any, string>]
      | [config: FieldOutConfigWithName<any, string>]
  ) {
    let config = args.length === 2 ? { name: args[0], ...args[1] } : args[0]

    const { resolve = defaultFieldResolver } = config

    fieldDef.call(this, {
      ...config,
      resolve(root, args, ctx, info) {
        return resolve(root.__connectionSource, mergeArgs(root, args), ctx, info)
      },
    })
  }
  fn()
  block.field = fieldDef
}

function iterateNodes(nodes: any[], args: PaginationArgs, cb: (node: any, i: number) => void) {
  // If we want the first N of an array of nodes, it's pretty straightforward.
  if (typeof args.first === 'number') {
    const len = Math.min(args.first, nodes.length)
    for (let i = 0; i < len; i++) {
      cb(nodes[i], i)
    }
  } else if (typeof args.last === 'number') {
    const len = Math.min(args.last, nodes.length)
    for (let i = 0; i < len; i++) {
      cb(nodes[i], i)
    }
  } else {
    // Only happens if we have a custom validateArgs that ignores first/last
    for (let i = 0; i < nodes.length; i++) {
      cb(nodes[i], i)
    }
  }
}

export type PaginationArgs = {
  first?: number | null
  after?: string | null
  last?: number | null
  before?: string | null
}

function defaultPageInfoFromNodes(nodes: any[], args: PaginationArgs) {
  return {
    hasNextPage: defaultHasNextPage(nodes, args),
    hasPreviousPage: defaultHasPreviousPage(nodes, args),
  }
}

function defaultHasNextPage(nodes: any[], args: PaginationArgs) {
  // If we're paginating forward, and we don't have an "after", we'll assume that we don't have
  // a previous page, otherwise we will assume we have one, unless the after cursor === "0".
  if (typeof args.first === 'number') {
    return nodes.length > args.first
  }
  // If we're paginating backward, and there are as many results as we asked for, then we'll assume
  // that we have a previous page
  if (typeof args.last === 'number') {
    if (args.before && args.before !== '0') {
      return true
    }
    return false
  }
  /* istanbul ignore next */
  throw new Error('Unreachable')
}

/** A sensible default for determining "previous page". */
function defaultHasPreviousPage(nodes: any[], args: PaginationArgs) {
  // If we're paginating forward, and we don't have an "after", we'll assume that we don't have
  // a previous page, otherwise we will assume we have one, unless the after cursor === "0".
  if (typeof args.first === 'number') {
    if (args.after && args.after !== '0') {
      return true
    }
    return false
  }
  // If we're paginating backward, and there are as many results as we asked for, then we'll assume
  // that we have a previous page
  if (typeof args.last === 'number') {
    return nodes.length >= args.last
  }
  /* istanbul ignore next */
  throw new Error('Unreachable')
}

const CURSOR_PREFIX = 'cursor:'

// Assumes we're only paginating in one direction.
function defaultCursorFromNode(
  node: any,
  args: PaginationArgs,
  ctx: any,
  info: GraphQLResolveInfo,
  { index, nodes }: { index: number; nodes: any[] }
) {
  let cursorIndex = index
  // If we're paginating forward, assume we're incrementing from the offset provided via "after",
  // e.g. [0...20] (first: 5, after: "cursor:5") -> [cursor:6, cursor:7, cursor:8, cursor:9, cursor: 10]
  if (typeof args.first === 'number') {
    if (args.after) {
      const offset = parseInt(args.after, 10)
      cursorIndex = offset + index + 1
    }
  }

  // If we're paginating backward, assume we're working backward from the assumed length
  // e.g. [0...20] (last: 5, before: "cursor:20") -> [cursor:15, cursor:16, cursor:17, cursor:18, cursor:19]
  if (typeof args.last === 'number') {
    if (args.before) {
      const offset = parseInt(args.before, 10)
      const len = Math.min(nodes.length, args.last)
      cursorIndex = offset - len + index
    } else {
      /* istanbul ignore next */
      throw new Error('Unreachable')
    }
  }
  return `${CURSOR_PREFIX}${cursorIndex}`
}

const getTypeNames = (
  fieldName: string,
  parentTypeName: string,
  fieldConfig: ConnectionFieldConfig,
  pluginConfig: ConnectionPluginConfig
) => {
  const targetTypeName =
    typeof fieldConfig.type === 'string' ? fieldConfig.type : (fieldConfig.type.name as string)

  // If we have changed the config specific to this field, on either the connection,
  // edge, or page info, then we need a custom type for the connection & edge.
  let connectionName: string
  if (fieldConfig.getConnectionName) {
    connectionName = fieldConfig.getConnectionName(fieldName, parentTypeName)
  } else if (pluginConfig.getConnectionName) {
    connectionName = pluginConfig.getConnectionName(fieldName, parentTypeName)
  } else if (isConnectionFieldExtended(fieldConfig)) {
    connectionName = `${parentTypeName}${upperFirst(fieldName)}_Connection`
  } else {
    connectionName = `${pluginConfig.typePrefix || ''}${targetTypeName}Connection`
  }

  // If we have modified the "edge" at all, then we need
  let edgeName
  if (fieldConfig.getEdgeName) {
    edgeName = fieldConfig.getEdgeName(fieldName, parentTypeName)
  } else if (pluginConfig.getEdgeName) {
    edgeName = pluginConfig.getEdgeName(fieldName, parentTypeName)
  } else if (isEdgeFieldExtended(fieldConfig)) {
    edgeName = `${parentTypeName}${upperFirst(fieldName)}_Edge`
  } else {
    edgeName = `${pluginConfig.typePrefix || ''}${targetTypeName}Edge`
  }

  return {
    edgeName,
    targetTypeName,
    connectionName,
  }
}

const isConnectionFieldExtended = (fieldConfig: ConnectionFieldConfig) => {
  if (fieldConfig.extendConnection || isEdgeFieldExtended(fieldConfig)) {
    return true
  }
  return false
}

const isEdgeFieldExtended = (fieldConfig: ConnectionFieldConfig) => {
  if (fieldConfig.extendEdge || fieldConfig.cursorType) {
    return true
  }
  return false
}

const upperFirst = (fieldName: string) => {
  return fieldName.slice(0, 1).toUpperCase().concat(fieldName.slice(1))
}

// Add some sanity checking beyond the normal type checks.
const assertCorrectConfig = (
  typeName: string,
  fieldName: string,
  pluginConfig: ConnectionPluginConfig,
  fieldConfig: any
) => {
  if (typeof fieldConfig.nodes !== 'function' && typeof fieldConfig.resolve !== 'function') {
    console.error(
      new Error(`Nexus Connection Plugin: Missing nodes or resolve property for ${typeName}.${fieldName}`)
    )
  }
  eachObj(pluginConfig.extendConnection || {}, (val, key) => {
    if (typeof fieldConfig[key] !== 'function' && val.requireResolver !== false) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing ${key} resolver property for ${typeName}.${fieldName}. Set requireResolver to "false" on the field config if you do not need a resolver.`
        )
      )
    }
  })
  eachObj(pluginConfig.extendEdge || {}, (val, key) => {
    if (typeof fieldConfig.edgeFields?.[key] !== 'function' && val.requireResolver !== false) {
      console.error(
        new Error(
          `Nexus Connection Plugin: Missing edgeFields.${key} resolver property for ${typeName}.${fieldName}. Set requireResolver to "false" on the edge field config if you do not need a resolver.`
        )
      )
    }
  })
}

function defaultValidateArgs(args: Record<string, any> = {}, info: GraphQLResolveInfo) {
  if (!(args.first || args.first === 0) && !(args.last || args.last === 0)) {
    throw new Error(
      `The ${info.parentType}.${info.fieldName} connection field requires a "first" or "last" argument`
    )
  }
  if (args.first && args.last) {
    throw new Error(
      `The ${info.parentType}.${info.fieldName} connection field requires a "first" or "last" argument, not both`
    )
  }
  if (args.first && args.before) {
    throw new Error(
      `The ${info.parentType}.${info.fieldName} connection field does not allow a "before" argument with "first"`
    )
  }
  if (args.last && args.after) {
    throw new Error(
      `The ${info.parentType}.${info.fieldName} connection field does not allow a "last" argument with "after"`
    )
  }
}

// Provided for use if you create a custom implementation and want to call the original.
connectionPlugin.defaultCursorFromNode = defaultCursorFromNode
connectionPlugin.defaultValidateArgs = defaultValidateArgs
connectionPlugin.defaultHasPreviousPage = defaultHasPreviousPage
connectionPlugin.defaultHasNextPage = defaultHasNextPage
connectionPlugin.base64Encode = base64Encode
connectionPlugin.base64Decode = base64Decode
connectionPlugin.CURSOR_PREFIX = CURSOR_PREFIX
