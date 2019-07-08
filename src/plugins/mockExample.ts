import { plugin } from "../plugin";

export type MockResolverPluginConfig = {};

export const mockResolverPlugin = (config: MockResolverPluginConfig) => {
  return plugin({
    name: "MockResolver",
    description:
      "Generates an example resolver that can be used when mocking out a schema",
    fieldDefTypes: `
mockResolve?: core.FieldResolver<TypeName, FieldName>
    `,
    schemaTypes: `
mockResolversEnabled: boolean | ((ctx: core.GetGen<"context">) => boolean)
    `,
    pluginDefinition(config) {},
  });
};
