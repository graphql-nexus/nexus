import { SchemaConfig } from "./builder";
import {
  GraphQLFieldResolver,
  GraphQLResolveInfo,
  GraphQLFieldConfig,
} from "graphql";
import { withNexusSymbol, NexusTypes, Omit } from "./definitions/_types";
import { isPromise } from "./utils";
import { NexusObjectTypeConfig } from "./definitions/objectType";
import { NexusOutputFieldConfig } from "./definitions/definitionBlocks";

export class PluginDef {
  constructor(readonly config: PluginConfig) {}
}
withNexusSymbol(PluginDef, NexusTypes.Plugin);

export type PluginVisitAfter = (
  result: any,
  root: any,
  args: any,
  ctx: any,
  info: GraphQLResolveInfo,
  breakVal: typeof BREAK_RESULT_VAL
) => any;

export type PluginVisitBefore = (
  root: any,
  args: any,
  ctx: any,
  info: GraphQLResolveInfo,
  nextVal: typeof NEXT_RESULT_VAL
) => any;

export type PluginVisitor = {
  after?: PluginVisitAfter;
  before?: PluginVisitBefore;
};

export type PluginDefinitionInfo = {
  /**
   * The name of the type we're applying the plugin to
   */
  typeName: string;
  /**
   * The name of the field we're applying the plugin to
   */
  fieldName: string;
  /**
   * The root-level SchemaConfig passed
   */
  nexusSchemaConfig: Omit<SchemaConfig, "types"> & Record<string, unknown>;
  /**
   * The config provided to the Nexus type containing the field.
   * Will not exist if this is a non-Nexus GraphQL type.
   */
  nexusTypeConfig?: Omit<NexusObjectTypeConfig<string>, "definition"> &
    Record<string, unknown>;
  /**
   * The config provided to the Nexus type containing the field.
   * Will not exist if this is a non-Nexus GraphQL type.
   */
  nexusFieldConfig?: Omit<NexusOutputFieldConfig<string, string>, "resolve"> &
    Record<string, unknown>;
  /**
   * Info about the GraphQL Field we're decorating.
   * Always guaranteed to exist, even for non-Nexus GraphQL types
   */
  graphqlFieldConfig: Omit<GraphQLFieldConfig<any, any>, "resolve">;
  /**
   * If we need to collect/reference metadata during the
   * plugin middleware definition stage, you can use this object.
   *
   * An example use would be to collect all fields that have a "validation"
   * property for their input to reference in runtime. After the schema is complete,
   * this object is frozen so it is not abused at runtime.
   */
  mutableObj: Record<string, any>;
};

export interface RootTypingImport {
  /**
   * File path to import the type from.
   */
  path: string;
  /**
   * Name of the type we want to reference in the `path`
   */
  name: string;
  /**
   * Name we want the imported type to be referenced as
   */
  alias?: string;
}

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
   * Any type definitions we want to add to the schema
   */
  schemaTypes?: string;
  /**
   * Any type definitions we want to add to the type definition option
   */
  typeDefTypes?: string;
  /**
   * Any type definitions we want to add to the field definitions
   */
  fieldDefTypes?: string;
  /**
   * Any extensions to the GraphQLInfoObject (do we need this?)
   */
  // infoExtension?: string;
  /**
   * Any types which should exist as standalone declarations to support this type
   */
  localTypes?: string;
  /**
   * Definition for the plugin. This will be executed against every
   * output type field on the schema.
   */
  pluginDefinition(pluginInfo: PluginDefinitionInfo): PluginVisitor | void;
}

/**
 * A plugin defines configuration which can document additional metadata options
 * for a type definition.
 *
 * Ultimately everything comes down to the "resolve" function
 * which executes the fields, and our plugin system will take that into account.
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

/**
 * On "before" plugins, the nextFn allows us to skip to the next resolver
 * in the chain
 */
const NEXT_RESULT_VAL = Object.freeze({});

/**
 * On "after" plugins, the breakerFn allows us to early-return, skipping the
 * rest of the plugin stack. Useful when encountering errors
 */
const BREAK_RESULT_VAL = Object.freeze({});

/**
 * Wraps a resolver with a plugin, "before" the resolver executes.
 * Returns a new resolver, which may subsequently be wrapped
 */
export function wrapPluginsBefore(
  resolver: GraphQLFieldResolver<any, any>,
  beforePlugins: [string, PluginVisitBefore][]
): GraphQLFieldResolver<any, any> {
  return async (root, args, ctx, info) => {
    for (let i = 0; i < beforePlugins.length; i++) {
      const [name, before] = beforePlugins[i];
      let result = before(root, args, ctx, info, NEXT_RESULT_VAL);
      if (isPromise(result)) {
        result = await result;
      }
      if (result === NEXT_RESULT_VAL) {
        continue;
      }
      if (result === undefined) {
        throw new Error(
          `Nexus: Expected return value from plugin ${name}:before, saw undefined`
        );
      }
      return result;
    }
    return resolver(root, args, ctx, info);
  };
}

/**
 * Wraps a resolver with a plugin, "after" the resolver executes.
 * May return a new value for the return type
 */
export function wrapPluginsAfter(
  resolver: GraphQLFieldResolver<any, any>,
  afterPlugins: [string, PluginVisitAfter][]
): GraphQLFieldResolver<any, any> {
  return async (root, args, ctx, info) => {
    let finalResult: any;
    try {
      finalResult = resolver(root, args, ctx, info);
      if (isPromise(finalResult)) {
        finalResult = await finalResult;
      }
    } catch (e) {
      finalResult = e;
    }
    for (let i = 0; i < afterPlugins.length; i++) {
      const [name, after] = afterPlugins[i];
      let returnVal = after(
        finalResult,
        root,
        args,
        ctx,
        info,
        BREAK_RESULT_VAL
      );
      if (isPromise(returnVal)) {
        returnVal = await returnVal;
      }
      if (returnVal === BREAK_RESULT_VAL) {
        return finalResult;
      }
      if (returnVal === undefined) {
        throw new Error(
          `Nexus: Expected return value from plugin ${name}:after, saw undefined`
        );
      }
    }
    return finalResult;
  };
}
