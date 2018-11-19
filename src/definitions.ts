import { assertValidName, GraphQLScalarType, GraphQLSchema } from "graphql";
import {
  GQLiteralAbstractType,
  GQLiteralDirectiveType,
  GQLiteralEnumType,
  GQLiteralInputObjectType,
  GQLiteralInterfaceType,
  GQLiteralObjectType,
  GQLiteralUnionType,
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
 * Defines a GQLiteral representation of a GraphQL Object.
 */
export function objectType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralObjectType<GenTypes, TypeName>) => void) {
  const factory = new GQLiteralObjectType<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return factory;
}

/**
 * Define a GQLiteral representation of a GraphQL interface type.
 */
export function interfaceType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (arg: GQLiteralInterfaceType<GenTypes, TypeName>) => void
) {
  const factory = new GQLiteralInterfaceType<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return factory;
}

/**
 * Union types are very similar to interfaces, but they don't get to specify
 * any common fields between the types.
 *
 * There are two ways to create a GraphQLUnionType with GQLiteralUnion:
 *
 * As an array of types to satisfy the union:
 *
 * const SearchResult = GQLiteralUnion('SearchResult', ['Human', 'Droid', 'Starship'])
 *
 * As a function, where other unions can be mixed in:
 *
 * const CombinedResult = GQLiteralUnion('CombinedResult', t => {
 *   t.mix('SearchResult')
 *   t.members('OtherType', 'AnotherType')
 * })
 */
export function unionType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralUnionType<GenTypes, TypeName>) => void) {
  const factory = new GQLiteralUnionType<GenTypes>(assertValidName(name));
  fn(factory);
  return factory;
}

/**
 * A Enum is a special GraphQL type that represents a set of symbolic names (members)
 * bound to unique, constant values. There are three ways to create a GraphQLEnumType
 * with GQLiteralEnum:
 *
 * As an array of enum values:
 *
 * const Episode = GQLiteralEnum('Episode', ['NEWHOPE', 'EMPIRE', 'JEDI'])
 *
 * As an object, with a mapping of enum values to internal values:
 *
 * const Episode = GQLiteralEnum('Episode', {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * });
 *
 * As a function, where other enums can be mixed in:
 *
 * const Episode = GQLiteralEnum('Episode', (t) => {
 *   t.mix('OneThroughThree')
 *   t.mix('FourThroughSix')
 *   t.mix('SevenThroughNine')
 *   t.members(['OTHER'])
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function enumType<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn:
    | ((arg: GQLiteralEnumType<GenTypes>) => void)
    | string[]
    | Record<string, string | number | object | boolean>
) {
  const factory = new GQLiteralEnumType<GenTypes>(assertValidName(name));
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
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralInputObjectType<GenTypes>) => void) {
  const factory = new GQLiteralInputObjectType<GenTypes>(assertValidName(name));
  fn(factory);
  return factory;
}

/**
 * A `GQLiteralAbstractType` object contains fields that can be shared among
 * `GQLiteralObject`, `GQLiteralInterface`, `GQLiteralInputObject` or other `GQLiteralAbstractType` types.
 *
 * Unlike concrete GraphQL types (types that show up in the generated schema),
 * GQLiteralAbstractType types must be mixed in using the actual JS object returned by this
 * function rather than a string "name" representing the type.
 *
 * If an AbstractType is mixed into a `GQLiteralInputObject` type, the `args` and
 * `resolver` fields are ignored.
 *
 * @return GQLiteralAbstractType
 */
export function abstractType<GenTypes = GQLiteralGen>(
  fn: (arg: GQLiteralAbstractType<GenTypes>) => void
) {
  const factory = new GQLiteralAbstractType<GenTypes>();
  fn(factory);
  // This is not wrapped in a type, since it's not actually a concrete (named) type.
  return factory;
}

/**
 * Defines an argument for a field type. This argument can be reused across multiple objects or interfaces
 * This is also exposed during type definition as shorthand via the various
 * `__Arg` methods: `fieldArg`, `stringArg`, `intArg`, etc.
 */
export function arg<GenTypes = GQLiteralGen>(
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

/**
 * Defines a directive that can be used by the schema. Directives should
 * be rarely used, as they only function for external consumers of the schema.
 */
export function directiveType<
  GenTypes = GQLiteralGen,
  DirectiveName extends string = any
>(
  name: DirectiveName,
  config:
    | Types.DirectiveConfig<GenTypes, DirectiveName>
    | ((arg: GQLiteralDirectiveType<GenTypes>) => void)
) {
  const directive = new GQLiteralDirectiveType<GenTypes>(assertValidName(name));
  if (typeof config === "function") {
    config(directive);
  } else {
    directive.locations(...config.locations);
  }
  return directive;
}
