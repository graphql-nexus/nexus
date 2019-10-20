import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";
import { withNexusSymbol, NexusTypes } from "./definitions/_types";
import { validatePluginConfig } from "./plugin";

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
  name: string;
  onInstall?: PluginOnInstallHandler;
};

export type PluginOnInstallHandler = (
  builder: PluginBuilderLens
) => { types: NexusAcceptedTypeDef[] };

/**
 * The processed version of a plugin config. This lower level version has
 * defaults provided for optionals etc.
 */
export type InternalPluginConfig = Required<PluginConfig>;

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
export function createPlugin(config: PluginConfig): PluginDef {
  validatePluginConfig(config);
  const internalConfig = { ...configDefaults, ...config };
  return new PluginDef(internalConfig);
}

const configDefaults = {
  onInstall: () => ({ types: [] }),
};

/**
 * A definition for a plugin. Should be passed to the `plugins: []` option
 * on makeSchema. Refer to `createPlugin` factory for full doc.
 */
export class PluginDef {
  constructor(readonly config: InternalPluginConfig) {}
}
withNexusSymbol(PluginDef, NexusTypes.Plugin);

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
export function initialize(
  builder: SchemaBuilder,
  plugin: PluginDef
): PluginController {
  const state = {
    onInstallTriggered: false,
  };

  const builderLens: PluginBuilderLens = {
    hasType: builder.hasType,
  };

  return {
    triggerOnInstall: () => {
      // Enforce the invariant that a lifecycle hook will only ever be called once.
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
      let hookResult: ReturnType<PluginOnInstallHandler>;
      try {
        hookResult = plugin.config.onInstall(builderLens);
      } catch (error) {
        throw new Error(
          `Plugin ${plugin.config.name} failed on "onInstall" hook:\n\n${error.stack}`
        );
      }

      validateOnInstallHookResult(plugin, hookResult);
      hookResult.types.forEach((t) => builder.addType(t));
    },
  };
}

/**
 * Validate that the data returned from a plugin from the `onInstall` hook is valid.
 */
function validateOnInstallHookResult(
  plugin: PluginDef,
  hookResult: ReturnType<PluginOnInstallHandler>
): void {
  if (
    hookResult === null ||
    typeof hookResult !== "object" ||
    !Array.isArray(hookResult.types)
  ) {
    throw new Error(
      `Plugin "${plugin.config.name}" returned invalid data for "onInstall" hook:\n\nexpected structure:\n\n  { types: NexusAcceptedTypeDef[] }\n\ngot:\n\n  ${hookResult}`
    );
  }
  // TODO we should validate that the array members all fall under NexusAcceptedTypeDef
}
