import {
  GraphQLSchema,
  GraphQLNamedType,
  isObjectType,
  GraphQLScalarType,
  assertValidName,
} from "graphql";
import * as Types from "./types";
import {
  GQLiteralNamedType,
  GQLiteralObjectType,
  GQLiteralInterfaceType,
  GQLiteralEnumType,
  GQLiteralInputObjectType,
  GQLiteralAbstract,
  GQLiteralUnionType,
  GQLiteralDirectiveType,
} from "./objects";
import { enumShorthandMembers, buildTypes } from "./utils";
import { runBuildArtifacts } from "./typebuilder";

/**
 * Wraps a GQLiteralType object, since all GQLiteral types have a
 * name, but that name isn't relevant to the type object until it's
 * constructed so we don't want it as a public member, purely for
 * intellisense/cosmetic purposes :)
 */
export class GQLiteralTypeWrapper<
  T extends GQLiteralNamedType = GQLiteralNamedType
> {
  constructor(readonly name: string, readonly type: T) {}
}

/**
 * Defines a GraphQL Scalar type
 */
export function GQLiteralScalar(name: string, options: Types.ScalarOpts) {
  return new GraphQLScalarType({ name: assertValidName(name), ...options });
}

/**
 * Defines a GraphQL Object
 */
export function GQLiteralObject<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralObjectType<GenTypes, TypeName>) => void) {
  const factory = new GQLiteralObjectType<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
}

/**
 * Define a GraphQL interface type
 */
export function GQLiteralInterface<
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
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralUnionType<GenTypes, TypeName>) => void) {
  const factory = new GQLiteralUnionType<GenTypes>(assertValidName(name));
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
 *   t.members(['OTHER'])
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function GQLiteralEnum<
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
  return new GQLiteralTypeWrapper(name, factory);
}

/**
 *
 */
export function GQLiteralInputObject<
  GenTypes = GQLiteralGen,
  TypeName extends string = any
>(name: TypeName, fn: (arg: GQLiteralInputObjectType<GenTypes>) => void) {
  const factory = new GQLiteralInputObjectType<GenTypes>(assertValidName(name));
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
export function GQLiteralAbstractType<GenTypes = GQLiteralGen>(
  fn: (arg: GQLiteralAbstract<GenTypes>) => void
) {
  const factory = new GQLiteralAbstract<GenTypes>();
  fn(factory);
  // This is not wrapped in a type, since it's not actually a concrete (named) type.
  return factory;
}

/**
 * Defines an argument for a field type. This argument can be reused across multiple objects or interfaces
 * This is also exposed during type definition as shorthand via the various
 * `__Arg` methods: `fieldArg`, `stringArg`, `intArg`, etc.
 */
export function GQLiteralArg<GenTypes = GQLiteralGen>(
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
export function GQLiteralDirective<
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

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GQLiteral layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function GQLiteralSchema<GenTypes = GQLiteralGen>(
  options: Types.SchemaConfig<GenTypes>
) {
  const { types: typeMap, directives } = buildTypes(options.types, options);
  const { Query, Mutation, Subscription } = typeMap;
  if (!isObjectType(Query)) {
    throw new Error("You must supply a Query type to create a valid schema");
  }
  if (Mutation && !isObjectType(Mutation)) {
    throw new Error(
      `Expected Mutation to be a GraphQLObjectType, saw ${
        Mutation.constructor.name
      }`
    );
  }
  if (Subscription && !isObjectType(Subscription)) {
    throw new Error(
      `Expected Subscription to be a GraphQLObjectType, saw ${
        Subscription.constructor.name
      }`
    );
  }
  const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
    directives: directives.definitions,
    types: Object.keys(typeMap).reduce((result: GraphQLNamedType[], key) => {
      result.push(typeMap[key]);
      return result;
    }, []),
  });

  // Only in development envs do we want to worry about regenerating the
  // schema definition and/or generated types.
  if (process.env.NODE_ENV !== "production") {
    runBuildArtifacts<GenTypes>(schema, options, directives);
  }

  return schema;
}
