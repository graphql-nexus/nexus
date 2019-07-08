import { plugin } from "../plugin";
import {
  isWrappingType,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLScalarType,
  isNonNullType,
  isListType,
} from "graphql";

export type GraphQLNamedOutputType =
  | GraphQLScalarType
  | GraphQLObjectType
  | GraphQLInterfaceType
  | GraphQLUnionType
  | GraphQLEnumType;

export type NullabilityGuardConfig = {
  onGuarded?(): void;
  fallbackValue?(type: GraphQLNamedOutputType): any;
};

export const nullabilityGuard = (pluginConfig: NullabilityGuardConfig) => {
  return plugin({
    name: "NullabilityGuard",
    description:
      "If we have a nullable field, we want to guard against this being an issue in production.",
    fieldDefTypes: `
/**
 * The nullability guard can be helpful, but is also a potentially expensive operation for lists.
 * We need to iterate the entire list to check for null items to guard against. Set this to
 * true to skip the null guard on a specific field if you know there's no potential for unsafe types.
 */
skipNullGuard?: boolean
`,
    pluginDefinition(config) {
      if (
        config.nexusFieldConfig &&
        (config.nexusFieldConfig as any).skipNullGuard
      ) {
        return;
      }
      let type = config.graphqlFieldConfig.type;
      let outerIsList: boolean = false;
      let outerNonNull: boolean = false;
      let hasListNonNull: boolean = false;
      let listNonNull: boolean[] = [];
      if (isNonNullType(type)) {
        outerNonNull = true;
        type = type.ofType;
      }
      if (isListType(type)) {
        outerIsList = true;
        type = type.ofType;
      }
      while (isWrappingType(type)) {
        if (isListType(type)) {
          type = type.ofType;
        }
        if (isNonNullType(type)) {
          hasListNonNull = true;
          listNonNull.push(true);
          type = type.ofType;
        } else {
          listNonNull.push(false);
        }
      }
      if (!outerNonNull && !hasListNonNull) {
        return;
      }
      return {
        after(result, root, args, ctx, info, breakVal) {
          if (outerNonNull && result == null) {
            if (outerIsList) {
              return [];
            }
          }
        },
      };
    },
  });
};

export function getFallbackValue(
  type: GraphQLNamedOutputType,
  config: NullabilityGuardConfig
) {
  //
}
