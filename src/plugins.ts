import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";
import { id } from "./utils";

/**
 * This is a read-only builder-like api exposed to plugins in the onInstall
 * hook. It proxies the Nexus Builder which is a much bigger beast that we do
 * not want to directly expose to plugins.
 */
type BuilderFacade = {
  hasType: (typeName: string) => boolean;
};

/**
 * This is the Neuxs Plugin interface that allows users to extend Nexus at
 * particular extension points. Plugins are just functions that receive hooks
 * which can then be registered upon with callbacks.
 */
export type Plugin = (hooks: Hooks) => void;

type Hooks = {
  onInstall: OnInstallHook;
};

type OnInstallHook = (onInstallHandler: OnInstallHandler) => void;

type OnInstallHandler = (
  builder: BuilderFacade
) => {
  types: NexusAcceptedTypeDef[];
};

/**
 * This is the interface that Nexus uses to drive plugins meaning triggering the
 * lifecycle events that plugins have registered for.
 */
type PluginController = {
  triggerOnInstall: () => void;
};

/**
 * This represents the internal data of a plugin controller.
 */
type PluginControllerState = {
  onInstallHandler: OnInstallHandler;
};

/**
 * Create new plugin controller state data with default values.
 */
const createControllerState = (): PluginControllerState => {
  const defaultOnInstallHandler = () => ({
    types: [],
  });

  return {
    onInstallHandler: defaultOnInstallHandler,
  };
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
  const state = createControllerState();

  plugin({
    onInstall: (handler) => {
      state.onInstallHandler = handler;
    },
  });

  return {
    triggerOnInstall: () => {
      const { types } = state.onInstallHandler({
        hasType: builder.hasType,
      });
      types.forEach(builder.addType);
    },
  };
};

/**
 * Create a Nexus Plugin. This function is just a convenience for not having to
 * import the Plugin type. Feel free to do this instead:
 *
 *     import { Plugin } from "nexus"
 *     export myPlugin: Plugin = (hooks) => { ... }
 *
 */
export const create = <Plugin>id;
