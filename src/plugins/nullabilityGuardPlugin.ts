import { isCollection, forEach } from "iterall";
import { plugin } from "../plugin";
import {
  isWrappingType,
  isNonNullType,
  isListType,
  GraphQLResolveInfo,
} from "graphql";
import { GraphQLNamedOutputType } from "../definitions/_types";
import { printedGenType, isPromiseLike } from "../utils";
import { GetGen, GenericFieldResolver } from "../typegenTypeHelpers";

interface OnGuardedInfo {
  root: any;
  args: any;
  ctx: GetGen<"context">;
  info: GraphQLResolveInfo;
}

export type NullabilityGuardConfig = {
  onGuarded?(obj: OnGuardedInfo): void;
  fallbackValue?(type: GraphQLNamedOutputType): any;
};

const schemaDefTypes = printedGenType({
  name: "nullGuardFallback",
  optional: true,
  type: "(root, arg, ctx, info) => any",
  description: `
    When there's a null value for this type, we should recover by supplying this value instead.
    This can be added at the schema, to define global guards.
  `,
});

const objectTypeDefTypes = printedGenType({
  name: "nullGuardFallback",
  optional: true,
  type: "(root, arg, ctx, info) => any",
  description: `
    When there's a null value for this type, we should recover by supplying this value instead.
    This can be added to any object type
  `,
});

const fieldDefTypes = printedGenType({
  name: "skipNullGuard",
  optional: true,
  type: "boolean",
  description: `
    The nullability guard can be helpful, but is also a pottentially expensive operation for lists.
    We need to iterate the entire list to check for null items to guard against. Set this to true
    to skip the null guardd on a specific field if you know there's no potential for unsafe types.
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
      const { fieldConfig } = config.fieldExtension;
      if ((fieldConfig as any).skipNullGuard) {
        return;
      }
      let finalConfig = {
        onGuarded: pluginConfig.onGuarded || (() => {}),
        fallbackValue: pluginConfig.fallbackValue,
      } as TypeGuardMeta;
      let type = config.parentTypeConfig;
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
    forEach(val as any, (val: any, i) => {
      if (isPromiseLike(val)) {
        hasPromise = true;
      } else if (val == null) {
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
  //
};

export function getFallbackValue(
  type: GraphQLNamedOutputType,
  config: NullabilityGuardConfig
) {
  //
}
