import { MaybeThunk, NexusTypes } from "./_types";
import { wrappedType } from "./wrappedType";

export interface EnumMemberInfo {
  name: string;
  value: any;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
}

export interface EnumMemberConfig {
  value?: any;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
}

export interface EnumTypeConfig<TypeName extends string, GenTypes = NexusGen> {
  name: TypeName;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  members: Array<string | EnumMemberInfo>;
}

export type EnumTypeDef = ReturnType<typeof enumType>;

export function enumType<TypeName extends string>(
  config: EnumTypeConfig<TypeName>
) {
  return wrappedType({
    nexus: NexusTypes.Enum as NexusTypes.Enum,
    ...config,
  });
}

const enumShorthandMembers = (
  arg: string[] | Record<string, string | number | object | boolean>
): EnumMemberInfo[] => {
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
