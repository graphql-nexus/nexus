import { plugin } from "../plugin";

export const handleErrorPlugin = plugin({
  name: "HandleError",
  description: `Adds error-handling at the root level, so when errors occur they are all logged as necessary.`,
  pluginDefinition(config) {
    return {
      after(result, root, args, ctx, info) {
        if (result instanceof Error) {
          ctx.logError({
            error: result,
            root,
            args,
            info,
          });
        }
        return result;
      },
    };
  },
});
