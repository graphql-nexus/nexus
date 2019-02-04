import {
  GraphQLScalarTypeConfig,
  assertValidName,
  GraphQLScalarType,
} from "graphql";
import { NexusTypes, withNexusSymbol } from "./_types";

export interface ScalarBase
  extends Pick<
    GraphQLScalarTypeConfig<any, any>,
    "description" | "serialize" | "parseValue" | "parseLiteral"
  > {}

export interface NexusScalarTypeConfig<T extends string> extends ScalarBase {
  /**
   * The name of the scalar type
   */
  name: T;
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: string; // | DeprecationInfo;
  /**
   * Adds this type as a method on the Object/Interface definition blocks
   */
  asNexusMethod?: string;
}

export class NexusScalarTypeDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusScalarTypeConfig<string>
  ) {
    assertValidName(name);
  }
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusScalarTypeDef, NexusTypes.Scalar);

export function scalarType<TypeName extends string>(
  options: NexusScalarTypeConfig<TypeName>
) {
  return new NexusScalarTypeDef(options.name, options);
}

export function asNexusMethod<T extends GraphQLScalarType>(
  scalar: T,
  methodName: string
): T {
  // @ts-ignore
  scalar.asNexusMethod = methodName;
  return scalar;
}
