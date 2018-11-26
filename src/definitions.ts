import { assertValidName, GraphQLScalarType, GraphQLSchema } from "graphql";
import {
  GraphQLiteralAbstractType,
  GraphQLiteralDirectiveType,
  GraphQLiteralEnumType,
  GraphQLiteralInputObjectType,
  GraphQLiteralInterfaceType,
  GraphQLiteralObjectType,
  GraphQLiteralUnionType,
} from "./core";
import * as Types from "./types";
import { enumShorthandMembers } from "./utils";

/**
 * Defines a GQliteral representation of a GraphQL Scalar type.
 */
export function scalarType(name: string, options: Types.ScalarOpts) {
  return new GraphQLScalarType({ name: assertValidName(name), ...options });
}

/**
 * Defines a GraphQLiteral representation of a GraphQL Object.
 */
export function objectType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GraphQLiteralObjectType<GenTypes, TypeName>) => void) {
  const factory = new GraphQLiteralObjectType<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return factory;
}

/**
 * Define a GraphQLiteral representation of a GraphQL interface type.
 */
export function interfaceType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (arg: GraphQLiteralInterfaceType<GenTypes, TypeName>) => void
) {
  const factory = new GraphQLiteralInterfaceType<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return factory;
}

/**
 * Union types are very similar to interfaces, but they don't get to specify
 * any common fields between the types.
 *
 * There are two ways to create a GraphQLUnionType with GraphQLiteralUnion:
 *
 * As an array of types to satisfy the union:
 *
 * const SearchResult = GraphQLiteralUnion('SearchResult', ['Human', 'Droid', 'Starship'])
 *
 * As a function, where other unions can be mixed in:
 *
 * const CombinedResult = GraphQLiteralUnion('CombinedResult', t => {
 *   t.mix('SearchResult')
 *   t.members('OtherType', 'AnotherType')
 * })
 */
export function unionType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GraphQLiteralUnionType<GenTypes, TypeName>) => void) {
  const factory = new GraphQLiteralUnionType<GenTypes>(assertValidName(name));
  fn(factory);
  return factory;
}

/**
 * A Enum is a special GraphQL type that represents a set of symbolic names (members)
 * bound to unique, constant values. There are three ways to create a GraphQLEnumType
 * with GraphQLiteralEnum:
 *
 * As an array of enum values:
 *
 * const Episode = GraphQLiteralEnum('Episode', ['NEWHOPE', 'EMPIRE', 'JEDI'])
 *
 * As an object, with a mapping of enum values to internal values:
 *
 * const Episode = GraphQLiteralEnum('Episode', {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * });
 *
 * As a function, where other enums can be mixed in:
 *
 * const Episode = GraphQLiteralEnum('Episode', (t) => {
 *   t.mix('OneThroughThree')
 *   t.mix('FourThroughSix')
 *   t.mix('SevenThroughNine')
 *   t.members(['OTHER'])
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function enumType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn:
    | ((arg: GraphQLiteralEnumType<GenTypes>) => void)
    | string[]
    | Record<string, string | number | object | boolean>
) {
  const factory = new GraphQLiteralEnumType<GenTypes>(assertValidName(name));
  if (typeof fn === "function") {
    fn(factory);
  } else {
    factory.members(enumShorthandMembers(fn));
  }
  return factory;
}

/**
 *
 */
export function inputObjectType<
  GenTypes = GraphQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GraphQLiteralInputObjectType<GenTypes>) => void) {
  const factory = new GraphQLiteralInputObjectType<GenTypes>(assertValidName(name));
  fn(factory);
  return factory;
}

/**
 * A `abstractType` object contains fields that can be shared among
 * `GraphQLiteralObject`, `GraphQLiteralInterface`, `GraphQLiteralInputObject` or other `abstractType` types.
 *
 * Unlike concrete GraphQL types (types that show up in the generated schema),
 * abstractType types must be mixed in using the actual JS object returned by this
 * function rather than a string "name" representing the type.
 *
 * If an AbstractType is mixed into a `GraphQLiteralInputObject` type, the `args` and
 * `resolver` fields are ignored.
 */
export function abstractType<GenTypes = GraphQLiteralGen>(
  fn: (arg: GraphQLiteralAbstractType<GenTypes>) => void
) {
  const factory = new GraphQLiteralAbstractType<GenTypes>();
  fn(factory);
  // This is not wrapped in a type, since it's not actually a concrete (named) type.
  return factory;
}

/**
 * Defines an argument for a field type. This argument can be reused across multiple objects or interfaces
 * This is also exposed during type definition as shorthand via the various
 * `__Arg` methods: `fieldArg`, `stringArg`, `intArg`, etc.
 */
export function arg<GenTypes = GraphQLiteralGen>(
  type: Types.AllInputTypes<GenTypes> | Types.BaseScalars,
  options?: Types.ArgOpts
): Readonly<Types.ArgDefinition> {
  // This isn't wrapped for now because it's not a named type, it's really
  // just an object that can be reused in multiple locations.
  return {
    type,
    ...options,
  };
}

export const stringArg = (options?: Types.ArgOpts) => arg("String", options);

export const intArg = (options?: Types.ArgOpts) => arg("Int", options);

export const floatArg = (options?: Types.ArgOpts) => arg("Float", options);

export const idArg = (options?: Types.ArgOpts) => arg("ID", options);

export const booleanArg = (options?: Types.ArgOpts) => arg("Boolean", options);

/**
 * Defines a directive that can be used by the schema. Directives should
 * be rarely used, as they only function for external consumers of the schema.
 */
export function directiveType<
  GenTypes = GraphQLiteralGen,
  DirectiveName extends string = any
>(
  name: DirectiveName,
  config:
    | Types.DirectiveConfig<GenTypes, DirectiveName>
    | ((arg: GraphQLiteralDirectiveType<GenTypes>) => void)
) {
  const directive = new GraphQLiteralDirectiveType<GenTypes>(assertValidName(name));
  if (typeof config === "function") {
    config(directive);
  } else {
    directive.locations(...config.locations);
  }
  return directive;
}
