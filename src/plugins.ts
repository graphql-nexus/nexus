import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";
import { withNexusSymbol, NexusTypes } from "./definitions/_types";

/**
 * A read-only builder api exposed to plugins in the onInstall hook which
 * proxies very limited functionality into the internal Nexus Builder.
 */
export type PluginBuilderLens = {
  hasType: (typeName: string) => boolean;
};

/**
 * This is the Neuxs Plugin interface that allows users to extend Nexus at
 * particular extension points. Plugins are just functions that receive hooks
 * which can then be registered upon with callbacks.
 */
export type PluginConfig = {
  onInstall?: PluginOnInstallHandler;
};

/**
 * The plugin callback to execute when onInstall lifecycle event occurs.
 * OnInstall event occurs before type walking which means inline types are not
 * visible at this point yet. `builderLens.hasType` will only return true
 * for types the user has defined top level in their app, and any types added by
 * upstream plugins.
 */
export type PluginOnInstallHandler = (
  builder: PluginBuilderLens
) => { types: NexusAcceptedTypeDef[] };

/**
 * The interface used to drive plugin execution via lifecycle event triggering.
 */
type PluginController = {
  triggerOnInstall: () => void;
};

/**
 * This will gather the hook handlers (aka. callbacks, event handlers) a the
 * plugin has registered for and return a controller  to trigger said hooks,
 * thus controlling execution of the plugins' hook handlers.
 */
export const initialize = (
  builder: SchemaBuilder,
  plugin: PluginDef
): PluginController => {
  const state = {
    onInstallTriggered: false,
  };
  const builderLens: PluginBuilderLens = {
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
      // By doing addType on the types returned by a plugin right after it has
      // done so we make it possible for downstream plugins to see types added
      // by upstream plugins.
      plugin.config.onInstall(builderLens).types.forEach(builder.addType);
    },
  };
};

/**
 * The processed version of a plugin config. This lower level version has
 * defaults provided for optionals etc.
 */
export type InternalPluginConfig = Required<PluginConfig>;

/**
 * A definition for a plugin. Should be passed to the `plugins: []` option
 * on makeSchema. Refer to `createPlugin` factory for full doc.
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
