import {
  GraphQLScalarTypeConfig,
  assertValidName,
  GraphQLScalarType,
} from "graphql";
import { NexusTypes, withNexusSymbol, RootTypingDef } from "./_types";
import { decorateType } from "./decorateType";

export interface ScalarBase
  extends Pick<
    GraphQLScalarTypeConfig<any, any>,
    "description" | "serialize" | "parseValue" | "parseLiteral"
  > {}

export interface ScalarConfig {
  /**
   * Any deprecation info for this scalar type
   */
  deprecation?: string; // | DeprecationInfo;
  /**
   * Adds this type as a method on the Object/Interface definition blocks
   */
  asNexusMethod?: string;
  /**
   * Root type information for this type
   */
  rootTyping?: RootTypingDef;
}

export interface NexusScalarTypeConfig<T extends string>
  extends ScalarBase,
    ScalarConfig {
  /**
   * The name of the scalar type
   */
  name: T;
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

export type NexusScalarExtensions = {
  nexus: {
    asNexusMethod?: string;
    rootTyping?: RootTypingDef;
  };
};

export function scalarType<TypeName extends string>(
  options: NexusScalarTypeConfig<TypeName>
) {
  return new NexusScalarTypeDef(options.name, options);
}

export function asNexusMethod<T extends GraphQLScalarType>(
  scalar: T,
  methodName: string
): T {
  return decorateType(scalar, {
    asNexusMethod: methodName,
  });
}
