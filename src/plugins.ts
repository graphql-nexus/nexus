import { SchemaBuilder, NexusAcceptedTypeDef } from "./builder";
import { withNexusSymbol, NexusTypes } from "./definitions/_types";
import { venn } from "./utils";

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
 * Validate that the configuration given by a plugin is valid.
 */
function validatePluginConfig(plugin: PluginConfig): void {
  const validRequiredProps = ["name"];
  const validOptionalProps = ["onInstall"];
  const validProps = [...validRequiredProps, ...validOptionalProps];
  const givenProps = Object.keys(plugin);

  const printProps = (props: Iterable<string>): string => {
    return [...props].join(", ");
  };

  const [missingRequiredProps, ,] = venn(validRequiredProps, givenProps);
  if (missingRequiredProps.size > 0) {
    throw new Error(
      `Plugin "${plugin.name}" is missing required properties: ${printProps(
        missingRequiredProps
      )}`
    );
  }

  const nameType = typeof plugin.name;
  if (nameType !== "string") {
    throw new Error(
      `Plugin "${plugin.name}" is giving an invalid value for property name: expected "string" type, got ${nameType} type`
    );
  }

  if (plugin.name === "") {
    throw new Error(
      `Plugin "${plugin.name}" is giving an invalid value for property name: empty string`
    );
  }

  const [, , invalidGivenProps] = venn(validProps, givenProps);
  if (invalidGivenProps.size > 0) {
    throw new Error(
      `Plugin "${plugin.name}" is giving unexpected properties: ${printProps(
        invalidGivenProps
      )}`
    );
  }

  if (plugin.onInstall) {
    const onInstallType = typeof plugin.name;
    if (onInstallType !== "function") {
      throw new Error(
        `Plugin "${plugin.name}" is giving an invalid value for onInstall hook: expected "function" type, got ${onInstallType} type`
      );
    }
  }
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
      `Plugin "${plugin.config.name}" returned invalid data for "onInstall" hook: expected\n\n  { types: NexusAcceptedTypeDef[] }\n\n  got: ${hookResult}`
    );
  }
  // TODO we should validate that the array members all fall under NexusAcceptedTypeDef
}

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
      hookResult.types.forEach(builder.addType);
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
  validatePluginConfig(config);
  const internalConfig = { ...configDefaults, ...config };
  return new PluginDef(internalConfig);
};
