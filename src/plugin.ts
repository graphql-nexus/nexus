import { SchemaConfig, SchemaBuilder, BuilderLens } from "./builder";
import {
  ASTKindToNode,
  GraphQLResolveInfo,
  GraphQLFieldConfig,
  GraphQLFieldResolver,
  GraphQLObjectTypeConfig,
  GraphQLInterfaceTypeConfig,
  Visitor,
} from "graphql";
import { withNexusSymbol, NexusTypes, Omit } from "./definitions/_types";
import { isPromiseLike, PrintedTypeGen } from "./utils";
import {
  NexusFieldExtension,
  NexusObjectTypeExtension,
  NexusSchemaExtension,
  NexusInterfaceTypeExtension,
} from "./extensions";
import { NexusTypeExtensions } from "./definitions/decorateType";

export type CreateFieldResolverInfo = {
  /**
   * The internal Nexus "builder" object
   */
  builder: SchemaBuilder;
  /**
   * Info about the GraphQL Field we're decorating.
   * Always guaranteed to exist, even for non-Nexus GraphQL types
   */
  fieldConfig: Omit<GraphQLFieldConfig<any, any>, "resolve"> & {
    extensions: { nexus: NexusFieldExtension };
  };
  /**
   * The config provided to the Nexus type containing the field.
   * Will not exist if this is a non-Nexus GraphQL type.
   */
  parentTypeConfig:
    | Omit<GraphQLObjectTypeConfig<any, any>, "fields"> & {
        extensions: { nexus: NexusObjectTypeExtension };
      }
    | Omit<GraphQLInterfaceTypeConfig<any, any>, "fields"> & {
        extensions: { nexus: NexusInterfaceTypeExtension };
      };
  /**
   * The root-level SchemaConfig passed
   */
  schemaConfig: Omit<SchemaConfig, "types"> & {
    extensions: { nexus: NexusSchemaExtension };
  };
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

export type StringLike = PrintedTypeGen | string;

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
  onInstall?: (builder: BuilderLens) => void;
  /**
   * Executed once, just after types have been walked but also before the schema definition
   * types are materialized into GraphQL types. Use this opportunity to add / modify / remove
   * any types before we go through the resolution step.
   */
  onBeforeBuild?: (builder: BuilderLens) => void;
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
  onPrint?: (visitor: Visitor<ASTKindToNode>) => void;
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
  return new PluginDef(config);
}
plugin.completeValue = completeValue;
