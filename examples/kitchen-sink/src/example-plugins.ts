import { plugin } from "nexus";

export const logMutationTimePlugin = plugin({
  name: "LogMutationTime",
  onCreateFieldResolver(config) {
    if (config.parentTypeConfig.name !== "Mutation") {
      return;
    }
    return async (root, args, ctx, info, next) => {
      const startTimeMs = new Date().valueOf();
      const value = await next(root, args, ctx, info);
      const endTimeMs = new Date().valueOf();
      console.log(
        `Mutation ${info.operation.name} took ${endTimeMs - startTimeMs} ms`
      );
      return value;
    };
  },
});
