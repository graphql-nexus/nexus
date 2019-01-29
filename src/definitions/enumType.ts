import { NexusTypes } from "./_types";
import { wrappedType } from "./wrappedType";
import { GraphQLEnumValueConfig, GraphQLEnumValueConfigMap } from "graphql";

export interface EnumMemberInfo {
  name: string;
  value?: string | number | object | boolean;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string; // | DeprecationInfo;
}

export interface EnumTypeConfig<TypeName extends string, GenTypes = NexusGen> {
  name: TypeName;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * All members of the enum, either as an array of strings/definition objects, or as an object
   */
  members:
    | Array<string | EnumMemberInfo>
    | Record<string, string | number | object | boolean>;
}

export type EnumTypeDef<T> = ReturnType<typeof enumType>;

export function enumType<TypeName extends string>(
  config: EnumTypeConfig<TypeName>
) {
  const { members, ...rest } = config;
  const values: GraphQLEnumValueConfigMap = {};
  if (Array.isArray(members)) {
    members.forEach((m) => {
      if (typeof m === "string") {
        values[m] = { value: m };
      } else {
        values[m.name] = {
          value: typeof m.value === "undefined" ? m : m.value,
          deprecationReason: m.deprecation,
          description: m.description,
        };
      }
    });
  } else {
    Object.keys(members).forEach((key) => {
      values[key] = {
        value: members[key],
      };
    });
  }
  if (!Object.keys(values).length) {
    throw new Error(
      `GraphQL Nexus: Enum ${config.name} must have at least one member`
    );
  }
  return wrappedType({
    nexus: NexusTypes.Enum as NexusTypes.Enum,
    values,
    ...rest,
  });
}

const enumShorthandMembers = (arg: string[]): EnumMemberInfo[] => {
  if (Array.isArray(arg)) {
    return arg.map((name) => ({ name, value: name }));
  }
  return Object.keys(arg).map((name) => {
    return {
      name,
      value: arg[name],
    };
  });
};
