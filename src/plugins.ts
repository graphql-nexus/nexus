import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";

/**
 * This is a read-only builder-like api exposed to plugins in the onInstall
 * hook. It proxies the Nexus Builder which is a much bigger beast that we do
 * not want to directly expose to plugins.
 */
export type OnInstallBuilder = {
  hasType: (typeName: string) => boolean;
};

/**
 * This is the Neuxs Plugin interface that allows users to extend Nexus at
 * particular extension points. Plugins are just functions that receive hooks
 * which can then be registered upon with callbacks.
 */
export type Plugin = {
  onInstall: OnInstallHandler;
};

type OnInstallHandler = (
  builder: OnInstallBuilder
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
export const initializePlugin = (
  builder: SchemaBuilder,
  plugin: Plugin
): PluginController => {
  return {
    triggerOnInstall: () => {
      if (plugin.onInstall) {
        const { types } = plugin.onInstall({
          hasType: builder.hasType,
        });
        types.forEach(builder.addType);
      }
    },
  };
};

/**
 * Create a Nexus Plugin. This function is just a convenience for not having to
 * import the Plugin type. Feel free to do this instead:
 *
 *     import { Plugin } from "nexus"
 *     export default { ... } as Plugin
 *
 */
export const create = (plugin: Plugin): Plugin => plugin;
