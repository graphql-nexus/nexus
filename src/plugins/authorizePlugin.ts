import { plugin } from "../plugin";

export const authorizePlugin = plugin({
  name: "Authorize",
  description: "The authorize plugin makes it possible to guard against types",
  onCreateFieldResolver(builder) {
    const { authorize } = builder.fieldExtension.config;
    if (!authorize) {
      return;
    }
    return function(root, args, ctx, info, next) {
      return plugin.completeValue(
        authorize(root, args, ctx, info),
        (authResult) => {
          if (authResult instanceof Error) {
            throw authResult;
          }
          if (authResult === false) {
            throw new Error("Not authorized");
          }
          if (authResult === true) {
            return next(root, args, ctx, info);
          }
          const {
            fieldName,
            parentType: { name: parentTypeName },
          } = info;
          throw new Error(
            `Nexus authorize for ${parentTypeName}.${fieldName} Expected a boolean or Error, saw ${authResult}`
          );
        }
      );
    };
  },
});
