import { assertValidName, GraphQLScalarType } from "graphql";
import {
  DirectiveTypeDef,
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

export function objectType<GenTypes = NexusGen, TypeName extends string = any>(
  name: TypeName,
  fn: (t: ObjectTypeDef<GenTypes, TypeName>) => void
) {
  const factory = new ObjectTypeDef<GenTypes, TypeName>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

export function interfaceType<
  GenTypes = NexusGen,
  TypeName extends string = any
>(name: TypeName, fn: (t: InterfaceTypeDef<GenTypes, TypeName>) => void) {
  const factory = new InterfaceTypeDef<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return new WrappedType(factory);
}

export function unionType<GenTypes = NexusGen, TypeName extends string = any>(
  name: TypeName,
  fn: (t: UnionTypeDef<GenTypes, TypeName>) => void
) {
  const factory = new UnionTypeDef<GenTypes>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

export function enumType<GenTypes = NexusGen, TypeName extends string = any>(
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

export function inputObjectType<
  GenTypes = NexusGen,
  TypeName extends string = any
>(name: TypeName, fn: (t: InputObjectTypeDef<GenTypes>) => void) {
  const factory = new InputObjectTypeDef<GenTypes>(assertValidName(name));
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

/**
 * Adds new fields to an existing type in the schema. Useful when splitting your
 * schema across several domains.
 *
 * @see http://graphql-nexus.com/api/extendType
 */
export function extendType<GenTypes = NexusGen, TypeName extends string = any>(
  name: TypeName,
  fn: (t: ExtendTypeDef<GenTypes, TypeName>) => void
) {
  const factory = new ExtendTypeDef<GenTypes, TypeName>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

/**
 * Defines a directive that can be used by the schema.
 *
 * > Note: Directives should be rarely used, as they only function for external
 * > consumers of the schema.
 */
export function directiveType<
  GenTypes = NexusGen,
  DirectiveName extends string = any
>(
  name: DirectiveName,
  config:
    | Types.DirectiveConfig<GenTypes, DirectiveName>
    | ((arg: DirectiveTypeDef<GenTypes>) => void)
) {
  const directive = new DirectiveTypeDef<GenTypes>(assertValidName(name));
  if (typeof config === "function") {
    config(directive);
  } else {
    directive.locations(...config.locations);
  }
  return new WrappedType(directive);
}
