import { plugin } from "../plugin";

export const mockResolverPlugin = plugin({
  name: "MockResolver",
  description:
    "Generates an example resolver that can be used when mocking out a schema",
  fieldDefTypes: `mockResolve?: core.FieldResolver<TypeName, FieldName>`,
  schemaTypes: `mockResolversEnabled: boolean | ((ctx: core.GetGen<"context">) => boolean)`,
  pluginDefinition(config) {
    if (!config.nexusFieldConfig) {
      return;
    }
    const mockResolveFn = config.nexusFieldConfig.mockResolve;
    if (!(mockResolveFn instanceof Function)) {
      return;
    }
    const mockResolversEnabled = config.nexusSchemaConfig
      .mockResolversEnabled as true | Function;
    if (mockResolversEnabled === false) {
      return;
    }
    if (
      mockResolversEnabled !== true &&
      !(mockResolversEnabled instanceof Function)
    ) {
      throw new Error(
        "Expected the schema config to have a valid mockResolversEnabled property (function or boolean)"
      );
    }
    return {
      before(root, args, ctx, info, nextVal) {
        if (
          mockResolversEnabled === true ||
          mockResolversEnabled(ctx) === true
        ) {
          return mockResolveFn(root, args, ctx, info);
        }
        return nextVal;
      },
    };
  },
});
