import {
  GraphQLSchema,
  GraphQLNamedType,
  isNamedType,
  isObjectType,
} from "graphql";
import * as Types from "./types";
import { gqliteralBuildTypes } from "./utils";
import {
  GQLiteralType,
  GQLiteralScalarType,
  GQLiteralObjectType,
  GQLiteralInterfaceType,
  GQLiteralEnumType,
  GQLiteralInputObjectType,
  GQLiteralAbstract,
  GQLiteralUnionType,
} from "./objects";
import { GeneratedSchemaTypes } from "../generatedTypes";

/**
 * Wraps a GQLiteralType object, since all GQLiteral types have a
 * name, but that name isn't relevant to the type object until it's
 * constructed so we don't want it as a public member, purely for
 * intellisense/cosmetic purposes :)
 */
export class GQLiteralTypeWrapper<T extends GQLiteralType> {
  constructor(readonly name: string, readonly type: T) {}
}

/**
 * Defines a GraphQL Scalar type
 *
 * @param {string} name
 * @param {object} options
 */
export function GQLiteralScalar(
  name: string,
  options: Types.GQLiteralScalarOptions
) {
  return new GQLiteralTypeWrapper(name, new GQLiteralScalarType(name, options));
}

/**
 * Defines a GraphQL object
 *
 * @param {string}
 */
export function GQLiteralObject<
  GenTypes = GeneratedSchemaTypes,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (
    arg: GQLiteralObjectType<GenTypes, TypeDefFor<GenTypes, TypeName>>
  ) => void
) {
  const factory = new GQLiteralObjectType<
    GenTypes,
    TypeDefFor<GenTypes, TypeName>
  >(name);
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
}

/**
 * Define a GraphQL interface type
 */
export function GQLiteralInterface<
  GenTypes = GeneratedSchemaTypes,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (
    arg: GQLiteralInterfaceType<GenTypes, TypeDefFor<GenTypes, TypeName>>
  ) => void
) {
  const factory = new GQLiteralInterfaceType(name);
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
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
export function GQLiteralUnion<
  GenTypes = GeneratedSchemaTypes,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralUnionType) => void) {
  const factory = new GQLiteralUnionType(name);
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
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
 *   t.member({value: 'OTHER'})
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function GQLiteralEnum<GenTypes = GeneratedSchemaTypes>(
  name: string,
  fn:
    | ((arg: GQLiteralEnumType<GenTypes>) => void)
    | string[]
    | Record<string, any>
) {
  const toCall = typeof fn === "function" ? fn : addEnumValue(fn);
  const factory = new GQLiteralEnumType(name);
  toCall(factory);
  return new GQLiteralTypeWrapper(name, factory);
}

/**
 * Handles the shorthand syntax for creating the GraphQLEnumType
 */
const addEnumValue = (arg: string[] | Record<string, any>) => (
  f: GQLiteralEnumType
) => {
  if (Array.isArray(arg)) {
    arg.forEach((value) => {
      f.member({ value });
    });
  } else {
    Object.keys(arg).forEach((value) => {
      f.member({ value: value, internalValue: arg[value] });
    });
  }
};

/**
 *
 */
export function GQLiteralInputObject(
  name: string,
  fn: (arg: GQLiteralInputObjectType) => void
) {
  const factory = new GQLiteralInputObjectType(name);
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
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
export function GQLiteralAbstractType(fn: (arg: GQLiteralAbstract) => void) {
  const factory = new GQLiteralAbstract();
  fn(factory);

  // This is not wrapped in a type, since it's not actually a concrete type.
  return factory;
}

/**
 * Defines an argument for a field type. This argument can be reused across multiple objects or interfaces
 * This is also exposed during type definition as shorthand via the various
 * `__Arg` methods: `fieldArg`, `stringArg`, `intArg`, etc.
 */
export function GQLiteralArgument(
  type: Types.GQLArgTypes,
  options?: Types.GQLArgOpts
) {}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GQLiteral layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function GQLiteralSchema(options: Types.GQLiteralSchemaConfig) {
  const typeMap = gqliteralBuildTypes(options.types);

  if (!isObjectType(typeMap["Query"])) {
    throw new Error("Missing a Query type");
  }

  const schema = new GraphQLSchema({
    query: typeMap["Query"] as any,
    mutation: typeMap["Mutation"] as any,
    subscription: typeMap["Subscription"] as any,
    types: Object.keys(typeMap).reduce(
      (result, key) => {
        result.push(typeMap[key]);
        return result;
      },
      [] as GraphQLNamedType[]
    ),
  });

  return schema;
}
