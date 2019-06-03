import {
  GraphQLLeafType,
  GraphQLCompositeType,
  GraphQLInputObjectType,
  GraphQLFieldResolver,
} from "graphql";

export type WrappedResolver = GraphQLFieldResolver<any, any> & {
  nexusWrappedResolver?: GraphQLFieldResolver<any, any>;
};

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type BaseScalars = "String" | "Int" | "Float" | "ID" | "Boolean";

export enum NexusTypes {
  Arg = "Arg",
  Enum = "Enum",
  Object = "Object",
  Interface = "Interface",
  InputObject = "InputObject",
  Scalar = "Scalar",
  Union = "Union",
  ExtendObject = "ExtendObject",
  ExtendInputObject = "ExtendInputObject",
  WrappedType = "WrappedType",
  OutputField = "OutputField",
  InputField = "InputField",
  DynamicInput = "DynamicInput",
  DynamicOutput = "DynamicOutput",
}

export interface DeprecationInfo {
  /**
   * Reason for the deprecation.
   */
  reason: string;
  /**
   * Date | YYYY-MM-DD formatted date of when this field
   * became deprecated.
   */
  startDate?: string | Date;
  /**
   * Field or usage that replaces the deprecated field.
   */
  supersededBy?: string;
}

export interface NonNullConfig {
  /**
   * Whether output fields are non-null by default.
   *
   * type Example {
   *   field: String!
   *   otherField: [String!]!
   * }
   *
   * @default true
   */
  output?: boolean;
  /**
   * Whether input fields (field arguments, input type members)
   * are non-null by default.
   *
   * input Example {
   *   field: String
   *   something: [String]
   * }
   *
   * @default false
   */
  input?: boolean;
}

export type GraphQLPossibleOutputs = GraphQLCompositeType | GraphQLLeafType;

export type GraphQLPossibleInputs = GraphQLInputObjectType | GraphQLLeafType;

export const NexusWrappedSymbol = Symbol.for("@nexus/wrapped");

export function withNexusSymbol(obj: Function, nexusType: NexusTypes) {
  obj.prototype[NexusWrappedSymbol] = nexusType;
}

export interface AsyncIterator<T> {
  next(value?: any): Promise<IteratorResult<T>>;
  return?(value?: any): Promise<IteratorResult<T>>;
  throw?(e?: any): Promise<IteratorResult<T>>;
}

export type RootTypingDef = string | RootTypingImport;

export type RootTypings = Record<string, string | RootTypingImport>;

export interface RootTypingImport {
  /**
   * File path to import the type from.
   */
  path: string;
  /**
   * Name of the type we want to reference in the `path`
   */
  name: string;
  /**
   * Name we want the imported type to be referenced as
   */
  alias?: string;
}
