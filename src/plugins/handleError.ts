import { plugin } from "../plugin";

export const handleErrorPlugin = plugin({
  name: "HandleError",
  description: `
    Adds error-handling at the root level, so when errors occur
    we can handle as necessary.
  `,
  definition(config) {
    return {
      after(result, root, args, ctx, info) {
        if (result instanceof Error) {
          ctx.logError();
        }
        return result;
      },
    };
  },
});
