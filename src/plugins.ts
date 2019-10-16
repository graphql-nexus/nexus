import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";
import { withNexusSymbol, NexusTypes } from "./definitions/_types";

/**
 * This is a read-only builder-like api exposed to plugins in the onInstall
 * hook. It proxies the Nexus Builder which is a much bigger beast that we do
 * not want to directly expose to plugins.
 */
export type BuilderLens = {
  hasType: (typeName: string) => boolean;
};

/**
 * This is the Neuxs Plugin interface that allows users to extend Nexus at
 * particular extension points. Plugins are just functions that receive hooks
 * which can then be registered upon with callbacks.
 */
export type PluginConfig = {
  onInstall?: OnInstallHandler;
};

export type InternalPluginConfig = Required<PluginConfig>;

type OnInstallHandler = (
  builder: BuilderLens
) => { types: NexusAcceptedTypeDef[] };

/**
 * This is the interface that Nexus uses to drive plugins meaning triggering the
 * lifecycle events that plugins have registered for.
 */
type PluginController = {
  triggerOnInstall: () => void;
};

/**
 * Initialize a plugin. This will gather the hook handlers (aka. callbacks,
 * event handlers) that the plugin has registered for. A controller is returned
 * that permits Nexus to trigger the hooks so executing the hook handlers.
 */
export const initialize = (
  builder: SchemaBuilder,
  plugin: PluginDef
): PluginController => {
  const state = {
    onInstallTriggered: false,
  };
  const builderLens: BuilderLens = {
    hasType: builder.hasType,
  };
  return {
    triggerOnInstall: () => {
      if (state.onInstallTriggered) {
        throw new Error(
          "Multiple triggers of onInstall hook detected. This should never happen. This is an internal error."
        );
      } else {
        state.onInstallTriggered = true;
      }
      plugin.config.onInstall(builderLens).types.forEach(builder.addType);
    },
  };
};

/**
 * A definition for a plugin. Should be passed to the `plugins: []` option
 * on makeSchema
 */
export class PluginDef {
  constructor(readonly config: InternalPluginConfig) {}
}
withNexusSymbol(PluginDef, NexusTypes.Plugin);

const configDefaults = {
  onInstall: () => ({ types: [] }),
};

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
export const createPlugin = (config: PluginConfig): PluginDef => {
  return new PluginDef({ ...configDefaults, ...config });
};
