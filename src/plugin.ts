import { GraphQLFieldResolver, GraphQLResolveInfo, GraphQLSchema } from 'graphql'
import { NexusAcceptedTypeDef, PluginBuilderLens, SchemaConfig } from './builder'
import {
  Maybe,
  NexusGraphQLFieldConfig,
  NexusGraphQLInterfaceTypeConfig,
  NexusGraphQLObjectTypeConfig,
  NexusTypes,
  Omit,
  withNexusSymbol,
} from './definitions/_types'
import { NexusSchemaExtension } from './extensions'
import { isPromiseLike, PrintedGenTyping, PrintedGenTypingImport, venn } from './utils'

export { PluginBuilderLens }

export type CreateFieldResolverInfo<FieldExt = any, TypeExt = any> = {
  /**
   * The internal Nexus "builder" object
   */
  builder: PluginBuilderLens
  /**
   * Info about the GraphQL Field we're decorating.
   * Always guaranteed to exist, even for non-Nexus GraphQL types
   */
  fieldConfig: Omit<NexusGraphQLFieldConfig, 'resolve' | 'extensions'> & {
    extensions?: Maybe<{ nexus?: { config: FieldExt } }>
  }
  /**
   * The config provided to the Nexus type containing the field.
   * Will not exist if this is a non-Nexus GraphQL type.
   */
  parentTypeConfig: (
    | Omit<NexusGraphQLObjectTypeConfig, 'fields' | 'extensions'>
    | Omit<NexusGraphQLInterfaceTypeConfig, 'fields' | 'extensions'>
  ) & {
    extensions?: Maybe<{ nexus?: { config: TypeExt } }>
  }
  /**
   * The root-level SchemaConfig passed
   */
  schemaConfig: Omit<SchemaConfig, 'types'>
  /**
   * Nexus specific metadata provided to the schema.
   */
  schemaExtension: NexusSchemaExtension
}

export type StringLike = PrintedGenTypingImport | PrintedGenTyping | string

export interface PluginConfig {
  /**
   * A name for the plugin, useful for errors, etc.
   */
  name: string
  /**
   * A description for the plugin
   */
  description?: string
  /**
   * Any type definitions we want to add to the field definitions
   */
  fieldDefTypes?: StringLike | StringLike[]
  /**
   * Any type definitions we want to add to the type definition option
   */
  objectTypeDefTypes?: StringLike | StringLike[]
  /**
   * Executed once, just before the types are walked. Useful for defining custom extensions
   * to the "definition" builders that are needed while traversing the type definitions, as
   * are defined by `dynamicOutput{Method,Property}` / `dynamicInput{Method,Property}`
   */
  /**
   * Existing Description:
   * The plugin callback to execute when onInstall lifecycle event occurs.
   * OnInstall event occurs before type walking which means inline types are not
   * visible at this point yet. `builderLens.hasType` will only return true
   * for types the user has defined top level in their app, and any types added by
   * upstream plugins.
   */
  onInstall?: (builder: PluginBuilderLens) => { types: NexusAcceptedTypeDef[] }
  /**
   * Executed once, just after types have been walked but also before the schema definition
   * types are materialized into GraphQL types. Use this opportunity to add / modify / remove
   * any types before we go through the resolution step.
   */
  onBeforeBuild?: (builder: PluginBuilderLens) => void
  /**
   * After the schema is built, provided the Schema to do any final config validation.
   */
  onAfterBuild?: (schema: GraphQLSchema) => void
  /**
   * If a type is not defined in the schema, our plugins can register an `onMissingType` handler,
   * which will intercept the missing type name and give us an opportunity to respond with a valid
   * type.
   */
  onMissingType?: (missingTypeName: string, builder: PluginBuilderLens) => any
  /**
   * Executed any time a field resolver is created. Returning a function here will add its in the
   * stack of middlewares with the (root, args, ctx, info, next) signature, where the `next` is the
   * next middleware or resolver to be executed.
   */
  onCreateFieldResolver?: (createResolverInfo: CreateFieldResolverInfo) => MiddlewareFn | undefined
  /**
   * Executed any time a "subscribe" handler is created. Returning a function here will add its in the
   * stack of middlewares with the (root, args, ctx, info, next) signature, where the `next` is the
   * next middleware or resolver to be executed.
   */
  onCreateFieldSubscribe?: (createSubscribeInfo: CreateFieldResolverInfo) => MiddlewareFn | undefined
  /**
   * Executed when a field is going to be printed to the nexus "generated types". Gives
   * an opportunity to override the standard behavior for printing our inferrred type info
   */
  // onPrint?: (visitor: Visitor<ASTKindToNode>) => void;
}

/**
 * Helper for allowing plugins to fulfill the return of the `next` resolver,
 * without paying the cost of the Promise if not required.
 */
export function completeValue<T, R = T>(
  valOrPromise: PromiseLike<T> | T,
  onSuccess: (completedVal: T) => R,
  onError?: (errVal: any) => T
) {
  if (isPromiseLike(valOrPromise)) {
    return valOrPromise.then((completedValue) => {
      return onSuccess(completedValue)
    }, onError)
  }
  // No need to handle onError, this should just be a try/catch inside the `onSuccess` block
  return onSuccess(valOrPromise)
}

export type MiddlewareFn = (
  source: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
  next: GraphQLFieldResolver<any, any>
) => any

/**
 * Takes a list of middlewares and executes them sequentially, passing the
 * "next" member of the chain to execute as the 5th arg.
 *
 * @param middleware
 * @param resolver
 */
export function composeMiddlewareFns<T>(
  middlewareFns: MiddlewareFn[],
  resolver: GraphQLFieldResolver<any, any>
) {
  let lastResolver = resolver
  for (const middleware of middlewareFns.reverse()) {
    const currentNext = middleware
    const previousNext = lastResolver
    lastResolver = (root, args, ctx, info) => {
      return currentNext(root, args, ctx, info, previousNext)
    }
  }
  return lastResolver
}

/**
 * A definition for a plugin. Should be passed to the `plugins: []` option
 * on makeSchema
 */
export class NexusPlugin {
  constructor(readonly config: PluginConfig) {}
}
withNexusSymbol(NexusPlugin, NexusTypes.Plugin)

/**
 * A plugin defines configuration which can document additional metadata options
 * for a type definition. This metadata can be used to decorate the "resolve" function
 * to provide custom functionality, such as logging, error handling, additional type
 * validation.
 *
 * You can specify options which can be defined on the schema,
 * the type or the plugin. The config from each of these will be
 * passed in during schema construction time, and used to augment the field as necessary.
 *
 * You can either return a function, with the new defintion of a resolver implementation,
 * or you can return an "enter" / "leave" pairing which will wrap the pre-execution of the
 * resolver and the "result" of the resolver, respectively.
 */
export function plugin(config: PluginConfig) {
  validatePluginConfig(config)
  return new NexusPlugin(config)
}
plugin.completeValue = completeValue

// For backward compat
export const createPlugin = plugin

/**
 * Validate that the configuration given by a plugin is valid.
 */
function validatePluginConfig(pluginConfig: PluginConfig): void {
  const validRequiredProps = ['name']
  const optionalPropFns: Array<keyof PluginConfig> = [
    'onInstall',
    'onCreateFieldResolver',
    'onCreateFieldSubscribe',
    'onBeforeBuild',
    'onMissingType',
    'onAfterBuild',
  ]
  const validOptionalProps = ['description', 'fieldDefTypes', 'objectTypeDefTypes', ...optionalPropFns]

  const validProps = [...validRequiredProps, ...validOptionalProps]
  const givenProps = Object.keys(pluginConfig)

  const printProps = (props: Iterable<string>): string => {
    return [...props].join(', ')
  }

  const [missingRequiredProps, ,] = venn(validRequiredProps, givenProps)
  if (missingRequiredProps.size > 0) {
    throw new Error(
      `Plugin "${pluginConfig.name}" is missing required properties: ${printProps(missingRequiredProps)}`
    )
  }

  const nameType = typeof pluginConfig.name
  if (nameType !== 'string') {
    throw new Error(
      `Plugin "${pluginConfig.name}" is giving an invalid value for property name: expected "string" type, got ${nameType} type`
    )
  }

  if (pluginConfig.name === '') {
    throw new Error(
      `Plugin "${pluginConfig.name}" is giving an invalid value for property name: empty string`
    )
  }

  const [, , invalidGivenProps] = venn(validProps, givenProps)
  if (invalidGivenProps.size > 0) {
    console.error(
      new Error(
        `Plugin "${pluginConfig.name}" is giving unexpected properties: ${printProps(invalidGivenProps)}`
      )
    )
  }

  optionalPropFns.forEach((fnName) => {
    const fnType = typeof pluginConfig[fnName]
    if (fnType !== 'function' && fnType !== 'undefined') {
      console.error(
        new Error(
          `Plugin "${pluginConfig.name}" is giving an invalid value for ${fnName} hook: expected "function" type, got ${fnType} type`
        )
      )
    }
  })
}
