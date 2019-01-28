export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type MaybePromise<T> = Promise<T> | T;

export type MaybeThunk<T> = T | (() => T);

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
  WrappedFn = "WrappedFn",
  OutputField = "OutputField",
  InputField = "InputField",
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

export interface NullabilityConfig {
  /**
   * Whether output fields can return null by default.
   *
   * type Example {
   *   field: String!
   *   otherField: [String!]!
   * }
   *
   * @default false
   */
  output?: boolean;
  /**
   * Whether input fields (field arguments, input type members)
   * are nullable by default.
   *
   * input Example {
   *   field: String
   *   something: [String]
   * }
   *
   * @default true
   */
  input?: boolean;
}
