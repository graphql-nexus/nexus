import { plugin } from "../plugin";

export const AuthorizationPlugin = plugin({
  name: "Authorization",
  localTypes: `
import { core } from 'nexus'; 
import { GraphQLResolveInfo } from 'graphql';
export type AuthorizeResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: core.RootValue<TypeName>,
  args: core.ArgsValue<TypeName, FieldName>,
  context: core.GetGen<"context">,
  info: GraphQLResolveInfo
) => core.PromiseOrValue<boolean | Error>;
  `,
  fieldDefTypes: `
/**
 * Authorization for an individual field. Returning "true"
 * or "Promise<true>" means the field can be accessed.
 * Returning "false" or "Promise<false>" will respond
 * with a "Not Authorized" error for the field. Returning
 * or throwing an error will also prevent the resolver from
 * executing.
 */  
authorize?: AuthorizeResolver<TypeName, FieldName>
  `,
  definition(config) {
    if (config.fieldConfig.authorize) {
      return {
        async before(root, args, ctx, info, next) {
          const authResult = await config.fieldConfig.authorize(
            root,
            args,
            ctx,
            info
          );
          if (authResult === true) {
            return next;
          }
          if (authResult === false) {
            throw new Error("Not authorized");
          }
          const {
            fieldName,
            parentType: { name: parentTypeName },
          } = info;
          if (authResult === undefined) {
            throw new Error(
              `Nexus authorize for ${parentTypeName}.${fieldName} Expected a boolean or Error, saw ${authResult}`
            );
          }
          return next;
        },
      };
    }
  },
});
