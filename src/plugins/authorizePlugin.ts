import { plugin } from "../plugin";
import {
  RootValue,
  ArgsValue,
  GetGen,
  MaybePromise,
} from "../typegenTypeHelpers";
import { GraphQLResolveInfo } from "graphql";
import { printedGenTyping, printedGenTypingImport } from "../utils";

const authorizeResolverImport = printedGenTypingImport({
  module: "nexus/dist/plugins/authorizePlugin",
  bindings: ["AuthorizeResolver"],
});

const fieldDefTypes = printedGenTyping({
  optional: true,
  name: "authorize",
  description: `
    Authorization for an individual field. Returning "true"
    or "Promise<true>" means the field can be accessed.
    Returning "false" or "Promise<false>" will respond
    with a "Not Authorized" error for the field. 
    Returning or throwing an error will also prevent the 
    resolver from executing.
  `,
  type: "AuthorizeResolver<TypeName, FieldName>",
  imports: [authorizeResolverImport],
});

export type AuthorizeResolver<
  TypeName extends string,
  FieldName extends string
> = (
  root: RootValue<TypeName>,
  args: ArgsValue<TypeName, FieldName>,
  context: GetGen<"context">,
  info: GraphQLResolveInfo
) => MaybePromise<boolean | Error>;

export interface AuthorizePluginErrorConfig {
  error: Error;
  root: any;
  args: any;
  ctx: GetGen<"context">;
  info: GraphQLResolveInfo;
}

export interface AuthorizePluginConfig {
  formatError?: (config: AuthorizePluginErrorConfig) => Error;
}

export const defaultFormatError = ({
  error,
}: AuthorizePluginErrorConfig): Error => {
  const err: Error & { originalError?: Error } = new Error("Not authorized");
  err.originalError = error;
  return err;
};

export const authorizePlugin = (config: AuthorizePluginConfig = {}) => {
  const { formatError = defaultFormatError } = config;
  const ensureError = (
    root: any,
    args: any,
    ctx: GetGen<"context">,
    info: GraphQLResolveInfo
  ) => (error: Error) => {
    const finalErr = formatError({ error, root, args, ctx, info });
    if (finalErr instanceof Error) {
      throw finalErr;
    }
    console.error(
      `Non-Error value ${finalErr} returned from custom formatError in authorize plugin`
    );
    throw new Error("Not authorized");
  };
  let hasWarned = false;
  return plugin({
    name: "NexusAuthorize",
    description:
      "The authorize plugin provides field-level authorization for a schema.",
    fieldDefTypes: fieldDefTypes,
    onCreateFieldResolver(config) {
      const authorize = config.fieldConfig.extensions?.nexus?.config.authorize;
      // If the field doesn't have an authorize field, don't worry about wrapping the resolver
      if (authorize == null) {
        return;
      }
      // If it does have this field, but it's not a function, it's wrong - let's provide a warning
      if (typeof authorize !== "function") {
        console.error(
          new Error(
            `The authorize property provided to ${
              config.fieldConfig.type
            } should be a function, saw ${typeof authorize}`
          )
        );
        return;
      }
      // If they have it, but didn't explicitly specify a plugins array, warn them.
      if (
        !config.schemaConfig.plugins?.find(
          (p) => p.config.name === "NexusAuthorize"
        )
      ) {
        if (!hasWarned) {
          console.warn(
            'The GraphQL Nexus "authorize" feature has been moved to a plugin, add plugins: [authorizePlugin()] to your makeSchema config to remove this warning.'
          );
          hasWarned = true;
        }
      }
      // The authorize wrapping resolver.
      return function(root, args, ctx, info, next) {
        let toComplete;
        try {
          toComplete = authorize(root, args, ctx, info);
        } catch (e) {
          toComplete = Promise.reject(e);
        }
        return plugin.completeValue(
          toComplete,
          (authResult) => {
            if (authResult === true) {
              return next(root, args, ctx, info);
            }
            const finalFormatError = ensureError(root, args, ctx, info);
            if (authResult instanceof Error) {
              finalFormatError(authResult);
            }
            if (authResult === false) {
              finalFormatError(new Error("Not authorized"));
            }
            const {
              fieldName,
              parentType: { name: parentTypeName },
            } = info;
            finalFormatError(
              new Error(
                `Nexus authorize for ${parentTypeName}.${fieldName} Expected a boolean or Error, saw ${authResult}`
              )
            );
          },
          (err) => {
            ensureError(root, args, ctx, info)(err);
          }
        );
      };
    },
  });
};
