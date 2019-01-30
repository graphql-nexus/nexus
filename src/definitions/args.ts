import { GetGen, HasGen } from "../typegenTypeHelpers";
import { NexusInputTypeName } from "./wrapping";
import { NexusTypes, withNexusSymbol } from "./_types";

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

export type PossibleArgNames<GenTypes = NexusGen> = HasGen<
  GenTypes,
  "allInputTypes"
> extends true
  ? GetGen<GenTypes, "allInputTypes">
  : string;

export interface NexusArgConfig<
  GenTypes = NexusGen,
  T extends PossibleArgNames<GenTypes> = PossibleArgNames<GenTypes>
> extends CommonArgConfig {
  /**
   * The type of the argument, either the string name of the type,
   * or the concrete
   */
  type: T | NexusInputTypeName<T>;
  /**
   * Configure the default for the object
   */
  default?: any; // TODO: Make this type-safe somehow
}

export class NexusArgDef<TypeName extends string> {
  constructor(readonly name: TypeName, protected config: NexusArgConfig) {}
  get value() {
    return this.config;
  }
}

withNexusSymbol(NexusArgDef, NexusTypes.Interface);

/**
 * Defines an argument that can be used in any object or interface type
 *
 * Takes the GraphQL type name and any options.
 *
 * The value returned from this argument can be used multiple times in any valid `args` object value
 *
 * @see https://graphql.github.io/learn/schema/#arguments
 */
export function arg(options: NexusArgConfig) {
  return new NexusArgDef(options.type, options);
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
