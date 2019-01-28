import { GraphQLScalarTypeConfig } from "graphql";
import { wrappedType } from "./wrappedType";
import { DeprecationInfo, NexusTypes } from "./_types";

export interface ScalarBase
  extends Pick<
    GraphQLScalarTypeConfig<any, any>,
    "description" | "serialize" | "parseValue" | "parseLiteral"
  > {}

export interface ScalarConfig extends ScalarBase {
  /**
   * The name of the scalar type
   */
  name: string;
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: string | DeprecationInfo;
}

export type ScalarTypeDef = ReturnType<typeof scalarType>;

export function scalarType(options: ScalarConfig) {
  return wrappedType({
    nexus: NexusTypes.Scalar as NexusTypes.Scalar,
    ...options,
  });
}
