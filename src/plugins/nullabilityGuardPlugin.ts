import { isCollection, forEach } from "iterall";
import { plugin } from "../plugin";
import {
  isWrappingType,
  isNonNullType,
  isListType,
  GraphQLResolveInfo,
} from "graphql";
import { GraphQLNamedOutputType } from "../definitions/_types";
import {
  isPromiseLike,
  printedGenTyping,
  printedGenTypingImport,
} from "../utils";
import { GetGen, GenericFieldResolver } from "../typegenTypeHelpers";

interface OnGuardedInfo {
  root: any;
  args: any;
  ctx: GetGen<"context">;
  info: GraphQLResolveInfo;
}

export type NullabilityGuardConfig = {
  shouldGuard?: boolean;
  onGuarded?: (obj: OnGuardedInfo) => void;
  fallbackValue?: (type: GraphQLNamedOutputType) => any;
};

const schemaDefTypes = printedGenTyping({
  name: "nullGuardFallback",
  optional: true,
  type:
    "<TypeName extends string>(typeName: TypeName, args: any, ctx: NexusGenTypes['context'], info: GraphQLResolveInfo) => core.GetGen2<'rootTypes', TypeName>",
  description: `
    When there's a null value for any, we can recover by supplying this value instead.
    This can be added at the schema, to define global guards.
  `,
});

const objectTypeDefTypes = printedGenTyping({
  name: "nullGuardFallback",
  optional: true,
  type:
    "(args: any, ctx: NexusGenTypes['context'], info: GraphQLResolveInfo) => core.GetGen2<'rootTypes', TypeName>",
  description: `
    When there's a null value for this type, we should recover by supplying this value instead.
    This can be added to any object type
  `,
  imports: [
    printedGenTypingImport({
      module: "graphql",
      bindings: ["GraphQLResolveInfo"],
    }),
    printedGenTypingImport({
      module: "nexus",
      bindings: ["core"],
    }),
  ],
});

const fieldDefTypes = printedGenTyping({
  name: "skipNullGuard",
  optional: true,
  type: "boolean",
  description: `
    The nullability guard can be helpful, but is also a pottentially expensive operation for lists.
    We need to iterate the entire list to check for null items to guard against. Set this to true
    to skip the null guard on a specific field if you know there's no potential for unsafe types.
  `,
});

interface TypeGuardMeta extends Required<NullabilityGuardConfig> {
  outerIsList: boolean;
  outerNonNull: boolean;
  hasListNonNull: boolean;
  listNonNull: boolean[];
}

type NullGuardFn = GenericFieldResolver<(val: unknown) => unknown>;

export const nullabilityGuard = (pluginConfig: NullabilityGuardConfig) => {
  return plugin({
    name: "NullabilityGuard",
    description:
      "If we have a nullable field, we want to guard against this being an issue in production.",
    objectTypeDefTypes,
    fieldDefTypes,
    schemaDefTypes,
    onCreateFieldResolver(config) {
      const { config: fieldConfig } = config.fieldExtension;
      if ((fieldConfig as any).skipNullGuard) {
        return;
      }
      let finalConfig = {
        onGuarded: pluginConfig.onGuarded || (() => {}),
      } as TypeGuardMeta;
      let type = config.fieldConfig.type;
      if (isNonNullType(type)) {
        finalConfig.outerNonNull = true;
        type = type.ofType;
      }
      if (isListType(type)) {
        finalConfig.outerIsList = true;
        type = type.ofType;
      }
      while (isWrappingType(type)) {
        if (isListType(type)) {
          type = type.ofType;
        }
        if (isNonNullType(type)) {
          finalConfig.hasListNonNull = true;
          finalConfig.listNonNull.push(true);
          type = type.ofType;
        } else {
          finalConfig.listNonNull.push(false);
        }
      }
      if (!finalConfig.outerNonNull && !finalConfig.hasListNonNull) {
        return;
      }
      const nonNullGuard = finalConfig.outerIsList
        ? nonNullListGuard(finalConfig)
        : nonNullValueGuard(finalConfig);
      return (root, args, ctx, info, next) => {
        return plugin.completeValue(
          next(root, args, ctx, info),
          nonNullGuard(root, args, ctx, info)
        );
      };
    },
  });
};

const nonNullListGuard = (finalConfig: TypeGuardMeta): NullGuardFn => (
  root,
  args,
  ctx,
  info
) => (val) => {
  if (val == null) {
    if (finalConfig.outerNonNull) {
      finalConfig.onGuarded({ root, args, ctx, info });
      return [];
    }
    return null;
  }
  let resultArr: any[] = [];
  let hasPromise = false;
  if (isCollection(val)) {
    forEach(val as any, (item: any) => {
      if (isPromiseLike(item)) {
        hasPromise = true;
      } else if (item == null) {
        finalConfig.onGuarded({ root, args, ctx, info });
      }
      resultArr.push(val);
    });
  }
  return hasPromise ? Promise.all(resultArr) : resultArr;
};

const nonNullValueGuard = (finalConfig: TypeGuardMeta): NullGuardFn => (
  root,
  args,
  ctx,
  info
) => (val) => {
  if (val != null) {
    return val;
  }
  finalConfig.onGuarded({ root, args, ctx, info });
  const type = info.schema.getType(info.parentType.name);
  if (
    type &&
    type.extensions &&
    type.extensions.nexus &&
    typeof type.extensions.nexus.config.nullGuardFallback === "function"
  ) {
    const fallback = type.extensions.nexus.config.nullGuardFallback(
      args,
      ctx,
      info
    );
    return (fallback || {})[info.fieldName];
  }
  if (
    info.schema.extensions &&
    info.schema.extensions.nexus &&
    typeof info.schema.extensions.nexus.config.nullGuardFallback === "function"
  ) {
    const fallback = info.schema.extensions.nullGuardFallback(
      info.parentType.name,
      args,
      ctx,
      info
    );
    return (fallback || {})[info.fieldName];
  }
  return type;
};
