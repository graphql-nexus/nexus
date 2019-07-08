import { plugin } from "../plugin";

/**
 * This cannot be implemented at the "validate" step, as it requires the variableValues
 */
export const ValidatePlugin = plugin({
  name: "ValidatePlugin",
  description: "Validates inputs ahead-of-time, before query execution",
  localTypes: `
type ValidatePluginValidateArgs<TypeName extends string, FieldName extends string> = () => any
  `,
  fieldDefTypes: `validateArgs: ValidatePluginValidateArgs<TypeName, FieldName>`,
  pluginDefinition(config) {
    const isRootType =
      config.typeName === "Query" ||
      config.typeName === "Mutation" ||
      config.typeName === "Subscription";
    const fieldValidateArgs =
      config.nexusFieldConfig && (config.nexusFieldConfig as any).validateArgs;
    // Collect all of the validateArgs in a map so we can validate the input args
    // for any fields that have them.
    if (fieldValidateArgs instanceof Function) {
      config.mutableObj[config.typeName] =
        config.mutableObj[config.typeName] || {};
      config.mutableObj[config.typeName][config.fieldName] = fieldValidateArgs;
    }
    // If we're not on a root type, we don't need to decorate the resolver.
    if (!isRootType) {
      return;
    }
    return {
      before(root, args, ctx, info, nextVal) {
        // Error collector
        // const errorObj = {};
        // info.fieldNodes;
        return nextVal;
      },
    };
  },
});
