import {
  SchemaConfig,
  PluginBuilderLens,
  NexusAcceptedTypeDef,
} from "./builder";
import { GraphQLResolveInfo, GraphQLFieldResolver } from "graphql";
import {
  withNexusSymbol,
  NexusTypes,
  Omit,
  NexusGraphQLFieldConfig,
  NexusGraphQLObjectTypeConfig,
  NexusGraphQLInterfaceTypeConfig,
} from "./definitions/_types";
import { isPromiseLike, PrintedGenTyping, venn } from "./utils";
import {
  NexusFieldExtension,
  NexusSchemaExtension,
  NexusTypeExtensions,
} from "./extensions";

export { PluginBuilderLens };

export type CreateFieldResolverInfo = {
  /**
   * The internal Nexus "builder" object
   */
  builder: PluginBuilderLens;
  /**
   * Info about the GraphQL Field we're decorating.
   * Always guaranteed to exist, even for non-Nexus GraphQL types
   */
  fieldConfig: Omit<NexusGraphQLFieldConfig, "resolve">;
  /**
   * The config provided to the Nexus type containing the field.
   * Will not exist if this is a non-Nexus GraphQL type.
   */
  parentTypeConfig:
    | NexusGraphQLObjectTypeConfig
    | NexusGraphQLInterfaceTypeConfig;
  /**
   * The root-level SchemaConfig passed
   */
  schemaConfig: Omit<SchemaConfig, "types">;
  /**
   * Nexus specific metadata provided to the schema.
   * Shorthand for `schemaConfig.extensions.nexus`
   */
  schemaExtension: NexusSchemaExtension;
  /**
   * Nexus specific metadata provided to the parent type
   * Shorthand for `typeConfig.extensions.nexus`
   */
  typeExtension: NexusTypeExtensions;
  /**
   * Nexus specific metadata provided to the field
   * Shorthand for `fieldConfig.extensions.nexus`
   */
  fieldExtension: NexusFieldExtension;
};

export type StringLike = PrintedGenTyping | string;

export interface PluginConfig {
  /**
   * A name for the plugin, useful for errors, etc.
   */
  name: string;
  /**
   * A description for the plugin
   */
  description?: string;
  /**
   * Any type definitions we want to add to the field definitions
   */
  fieldDefTypes?: StringLike | StringLike[];
  /**
   * Any type definitions we want to add to the type definition option
   */
  objectTypeDefTypes?: StringLike | StringLike[];
  /**
   * Any type definitions we want to add to the schema
   */
  schemaDefTypes?: StringLike | StringLike[];
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
  onInstall?: (builder: PluginBuilderLens) => { types: NexusAcceptedTypeDef[] };
  /**
   * Executed once, just after types have been walked but also before the schema definition
   * types are materialized into GraphQL types. Use this opportunity to add / modify / remove
   * any types before we go through the resolution step.
   */
  onBeforeBuild?: (builder: PluginBuilderLens) => void;
  /**
   * If a type is not defined in the schema, our plugins can register an `onMissingType` handler,
   * which will intercept the missing type name and give us an opportunity to respond with a valid
   * type.
   */
  onMissingType?: (missingTypeName: string) => any;
  /**
   * Executed any time a field resolver is created. Returning a function here will add its in the
   * stack of middlewares with the (root, args, ctx, info, next) signature, where the `next` is the
   * next middleware or resolver to be executed.
   */
  onCreateFieldResolver?: (
    createResolverInfo: CreateFieldResolverInfo
  ) => MiddlewareFn | undefined;
  /**
   * Executed any time a "subscribe" handler is created. Returning a function here will add its in the
   * stack of middlewares with the (root, args, ctx, info, next) signature, where the `next` is the
   * next middleware or resolver to be executed.
   */
  onCreateFieldSubscribe?: (
    createSubscribeInfo: CreateFieldResolverInfo
  ) => MiddlewareFn | undefined;
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
export function completeValue<T>(
  valOrPromise: PromiseLike<T> | T,
  onSuccess: (completedVal: T) => T,
  onError?: (errVal: any) => T
) {
  if (isPromiseLike(valOrPromise)) {
    return valOrPromise.then((completedValue) => {
      return onSuccess(completedValue);
    }, onError);
  }
  // No need to handle onError, this should just be a try/catch inside the `onSuccess` block
  return onSuccess(valOrPromise);
}

export type MiddlewareFn = (
  source: any,
  args: any,
  context: any,
  info: GraphQLResolveInfo,
  next: GraphQLFieldResolver<any, any>
) => any;

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
  let lastResolver = resolver;
  for (const middleware of middlewareFns.reverse()) {
    const currentNext = middleware;
    const previousNext = lastResolver;
    lastResolver = (root, args, ctx, info) => {
      return currentNext(root, args, ctx, info, previousNext);
    };
  }
  return lastResolver;
}

/**
 * A definition for a plugin. Should be passed to the `plugins: []` option
 * on makeSchema
 */
export class PluginDef {
  constructor(readonly config: PluginConfig) {}
}
withNexusSymbol(PluginDef, NexusTypes.Plugin);

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
  validatePluginConfig(config);
  return new PluginDef(config);
}
plugin.completeValue = completeValue;

// For backward compat
export const createPlugin = plugin;

/**
 * Validate that the configuration given by a plugin is valid.
 */
function validatePluginConfig(pluginConfig: PluginConfig): void {
  const validRequiredProps = ["name"];
  const validOptionalProps = [
    "description",
    "fieldDefTypes",
    "objectTypeDefTypes",
    "schemaDefTypes",
    "onInstall",
    "onBeforeBuild",
    "onMissingType",
    "onCreateFieldResolver",
    "onCreateFieldSubscribe",
  ];
  const validProps = [...validRequiredProps, ...validOptionalProps];
  const givenProps = Object.keys(pluginConfig);

  const printProps = (props: Iterable<string>): string => {
    return [...props].join(", ");
  };

  const [missingRequiredProps, ,] = venn(validRequiredProps, givenProps);
  if (missingRequiredProps.size > 0) {
    throw new Error(
      `Plugin "${
        pluginConfig.name
      }" is missing required properties: ${printProps(missingRequiredProps)}`
    );
  }

  const nameType = typeof pluginConfig.name;
  if (nameType !== "string") {
    throw new Error(
      `Plugin "${pluginConfig.name}" is giving an invalid value for property name: expected "string" type, got ${nameType} type`
    );
  }

  if (pluginConfig.name === "") {
    throw new Error(
      `Plugin "${pluginConfig.name}" is giving an invalid value for property name: empty string`
    );
  }

  const [, , invalidGivenProps] = venn(validProps, givenProps);
  if (invalidGivenProps.size > 0) {
    throw new Error(
      `Plugin "${
        pluginConfig.name
      }" is giving unexpected properties: ${printProps(invalidGivenProps)}`
    );
  }

  if (pluginConfig.onInstall) {
    const onInstallType = typeof pluginConfig.onInstall;
    if (onInstallType !== "function") {
      throw new Error(
        `Plugin "${pluginConfig.name}" is giving an invalid value for onInstall hook: expected "function" type, got ${onInstallType} type`
      );
    }
  }
}
