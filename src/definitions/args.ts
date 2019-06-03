import { GetGen, GetGen2 } from "../typegenTypeHelpers";
import { AllNexusInputTypeDefs, NexusWrappedType } from "./wrapping";
import { NexusTypes, withNexusSymbol } from "./_types";

export type ArgsRecord = Record<
  string,
  | NexusArgDef<string>
  | GetGen<"allInputTypes", string>
  | AllNexusInputTypeDefs<string>
>;

export interface CommonArgConfig {
  /**
   * Whether the field is required, `required: true` = `nullable: false`
   */
  required?: boolean;
  /**
   * Whether the field is nullable, `nullable: true` = `required: false`
   */
  nullable?: boolean;
  /**
   * Whether the argument is a list or not.
   *
   * null = not a list
   * true = list
   * array = nested list, where true/false decides
   * whether the list member can be nullable
   */
  list?: null | true | boolean[];
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
}

export interface ScalarArgConfig<T> extends CommonArgConfig {
  /**
   * Configure the default for the object
   */
  default?: T;
}

export type NexusArgConfigType<T extends GetGen<"allInputTypes", string>> =
  | T
  | AllNexusInputTypeDefs<T>
  | NexusWrappedType<AllNexusInputTypeDefs<T>>;

export interface NexusAsArgConfig<T extends GetGen<"allInputTypes", string>>
  extends CommonArgConfig {
  /**
   * Configure the default for the object
   */
  default?: GetGen2<"allTypes", T>; // TODO: Make this type-safe somehow
}

export interface NexusArgConfig<T extends GetGen<"allInputTypes", string>>
  extends NexusAsArgConfig<T> {
  /**
   * The type of the argument, either the string name of the type,
   * or the concrete Nexus type definition
   */
  type: NexusArgConfigType<T>;
}

export class NexusArgDef<TypeName extends string> {
  constructor(
    readonly name: TypeName,
    protected config: NexusArgConfig<string>
  ) {}
  get value() {
    return this.config;
  }
}
withNexusSymbol(NexusArgDef, NexusTypes.Arg);

/**
 * Defines an argument that can be used in any object or interface type
 *
 * Takes the GraphQL type name and any options.
 *
 * The value returned from this argument can be used multiple times in any valid `args` object value
 *
 * @see https://graphql.github.io/learn/schema/#arguments
 */
export function arg<T extends GetGen<"allInputTypes", string>>(
  options: { type: NexusArgConfigType<T> } & NexusArgConfig<T>
) {
  if (!options.type) {
    throw new Error('You must provide a "type" for the arg()');
  }
  return new NexusArgDef(
    typeof options.type === "string"
      ? options.type
      : (options.type as any).name,
    options
  );
}
export function stringArg(options?: ScalarArgConfig<string>) {
  return arg({ type: "String", ...options });
}
export function intArg(options?: ScalarArgConfig<number>) {
  return arg({ type: "Int", ...options });
}
export function floatArg(options?: ScalarArgConfig<number>) {
  return arg({ type: "Float", ...options });
}
export function idArg(options?: ScalarArgConfig<string>) {
  return arg({ type: "ID", ...options });
}
export function booleanArg(options?: ScalarArgConfig<boolean>) {
  return arg({ type: "Boolean", ...options });
}
