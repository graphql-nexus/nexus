import { SchemaConfig } from "./builder";
import { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import { withNexusSymbol, NexusTypes, Omit } from "./definitions/_types";
import { isPromise } from "./utils";

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
  breakFn: typeof breakerFn
) => any;

export type PluginVisitBefore = (
  root: any,
  args: any,
  ctx: any,
  info: GraphQLResolveInfo,
  next: typeof nextFn
) => any;

export type PluginVisitor = {
  after?: PluginVisitAfter;
  before?: PluginVisitBefore;
};

export interface PluginDefinitionInfo {
  /**
   *
   */
  typeConfig: any;
  /**
   *
   */
  fieldConfig: any;
  /**
   * The root-level SchemaConfig passed
   */
  schemaConfig: Omit<SchemaConfig, "types">;
  /**
   * If we need to collect/reference metadata during the
   * plugin middleware definition stage, you can use this object.
   *
   * An example use would be to collect all fields that have a "validation"
   * property for their input to reference in runtime. After the schema is complete,
   * this object is frozen so it is not abused at runtime.
   */
  mutableObj: object;
}

export interface PluginConfig {
  name: string;
  description?: string;
  schemaTypes?: string;
  typeDefTypes?: string;
  fieldDefTypes?: string;
  localTypes?: string;
  definition?(pluginInfo: PluginDefinitionInfo): PluginVisitor | void;
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
const nextFn = () => NEXT_RESULT_VAL;

/**
 * On "after" plugins, the breakerFn allows us to early-return, skipping the
 * rest of the plugin stack. Useful when encountering errors
 */
const breakerFn = () => BREAK_RESULT_VAL;
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
      let result = before(root, args, ctx, info, nextFn);
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
      let returnVal = after(finalResult, root, args, ctx, info, breakerFn);
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
