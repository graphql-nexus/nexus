import { assertValidName, GraphQLScalarType } from "graphql";
import {
  EnumTypeDef,
  InputObjectTypeDef,
  InterfaceTypeDef,
  ObjectTypeDef,
  UnionTypeDef,
  WrappedType,
  ExtendTypeDef,
} from "./core";
import * as Types from "./types";
import { enumShorthandMembers } from "./utils";
import { DeprecationInfo } from "./types";

export interface DefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {}

export interface ObjectTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  definition(t: ObjectTypeDef<TypeName, GenTypes>): void;
  description?: string;
  nullability?: string;
}

export function objectType<TypeName extends string, GenTypes = NexusGen>(
  config: ObjectTypeConfig<TypeName, GenTypes>
) {
  const factory = new ObjectTypeDef<TypeName, GenTypes>(assertValidName(name));
  config.definition(factory);
  return new WrappedType(factory);
}

export interface InterfaceTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  name: TypeName;
  definition(t: InterfaceTypeDef<TypeName, GenTypes>): void;
  description?: string;
  nullability?: string;
}

export function interfaceType<TypeName extends string, GenTypes = NexusGen>(
  config: InterfaceTypeConfig<TypeName, GenTypes>
) {
  const factory = new InterfaceTypeDef<TypeName, GenTypes>(
    assertValidName(config.name)
  );
  config.definition(factory);
  return new WrappedType(factory);
}

export interface UnionTypeConfig<TypeName extends string, GenTypes = NexusGen> {
  name: TypeName;
  definition(t: UnionTypeDef<TypeName, GenTypes>): void;
  description?: string;
  deprecation?: string | DeprecationInfo;
}

export function unionType<TypeName extends string, GenTypes = NexusGen>(
  config: UnionTypeConfig<TypeName, GenTypes>
) {
  assertValidName(config.name);
  const factory = new UnionTypeDef<TypeName, GenTypes>(config.name);
  config.definition(factory);
  return new WrappedType(factory);
}

export function enumType<TypeName extends string, GenTypes = NexusGen>(
  name: TypeName,
  fn:
    | ((arg: EnumTypeDef<GenTypes>) => void)
    | string[]
    | Record<string, string | number | object | boolean>
) {
  const factory = new EnumTypeDef<GenTypes>(assertValidName(name));
  if (typeof fn === "function") {
    fn(factory);
  } else {
    factory.members(enumShorthandMembers(fn));
  }
  return new WrappedType(factory);
}

export function inputObjectType<TypeName extends string, GenTypes = NexusGen>(
  name: TypeName,
  fn: (t: InputObjectTypeDef<TypeName, GenTypes>) => void
) {
  const factory = new InputObjectTypeDef<TypeName, GenTypes>(
    assertValidName(name)
  );
  fn(factory);
  return new WrappedType(factory);
}

export function scalarType(name: string, options: Types.ScalarOpts) {
  return new WrappedType(
    new GraphQLScalarType({ name: assertValidName(name), ...options })
  );
}

export function arg<GenTypes = NexusGen>(
  type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
  options?: Types.ArgOpts
): Types.ArgDefinition {
  // This isn't wrapped for now because it's not a named type, it's really
  // just an object that can be reused in multiple locations.
  return {
    type,
    ...options,
  };
}

export function stringArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("String", options);
}

export function intArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Int", options);
}

export function floatArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Float", options);
}

export function idArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("ID", options);
}

export function booleanArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Boolean", options);
}

export interface ExtendTypeConfig<
  TypeName extends string,
  GenTypes = NexusGen
> {
  type: TypeName;
  definition(t: ExtendTypeDef<TypeName, GenTypes>): void;
}

/**
 * Adds new fields to an existing type in the schema. Useful when splitting your
 * schema across several domains.
 *
 * @see http://graphql-nexus.com/api/extendType
 */
export function extendType<TypeName extends string, GenTypes = NexusGen>(
  name: TypeName,
  fn: (t: ExtendTypeDef<TypeName, GenTypes>) => void
) {
  const factory = new ExtendTypeDef<TypeName, GenTypes>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}
