import {
  GraphQLSchema,
  GraphQLNamedType,
  isObjectType,
  lexicographicSortSchema,
  printSchema,
  GraphQLScalarType,
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
} from "./objects";
import { enumShorthandMembers, buildTypes } from "./utils";

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
 *
 * @param {string} name
 * @param {object} options
 */
export function GQLiteralScalar(name: string, options: Types.ScalarOpts) {
  return new GraphQLScalarType({ name, ...options });
}

/**
 * Defines a GraphQL object
 *
 * @param {string}
 */
export function GQLiteralObject<GenTypes, TypeName extends string = any>(
  name: TypeName,
  fn: (arg: GQLiteralObjectType<GenTypes, TypeName>) => void
) {
  const factory = new GQLiteralObjectType<GenTypes, TypeName>(name);
  fn(factory);
  return new GQLiteralTypeWrapper(name, factory);
}

/**
 * Define a GraphQL interface type
 */
export function GQLiteralInterface<GenTypes, TypeName extends string = string>(
  name: TypeName,
  fn: (arg: GQLiteralInterfaceType<GenTypes, TypeName>) => void
) {
  const factory = new GQLiteralInterfaceType<GenTypes, TypeName>(name);
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
export function GQLiteralUnion<GenTypes, TypeName extends string = any>(
  name: TypeName,
  fn: (arg: GQLiteralUnionType<GenTypes, TypeName>) => void
) {
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
 *   t.members(['OTHER'])
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function GQLiteralEnum<GenTypes>(
  name: string,
  fn:
    | ((arg: GQLiteralEnumType<GenTypes>) => void)
    | string[]
    | Record<string, string | number | object | boolean>
) {
  const factory = new GQLiteralEnumType(name);
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
export function GQLiteralInputObject<GenTypes, TypeName extends string = any>(
  name: string,
  fn: (arg: GQLiteralInputObjectType<GenTypes, TypeName>) => void
) {
  const factory = new GQLiteralInputObjectType<GenTypes>(name);
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
export function GQLiteralAbstractType<GenTypes>(
  fn: (arg: GQLiteralAbstract<GenTypes>) => void
) {
  const factory = new GQLiteralAbstract();
  fn(factory);
  // This is not wrapped in a type, since it's not actually a concrete (named) type.
  return factory;
}

/**
 * Defines an argument for a field type. This argument can be reused across multiple objects or interfaces
 * This is also exposed during type definition as shorthand via the various
 * `__Arg` methods: `fieldArg`, `stringArg`, `intArg`, etc.
 */
export function GQLiteralArg(
  type: any, // TODO: make type safe
  options?: Types.ArgOpts
): Types.ArgDefinition {
  // This isn't wrapped for now because it's not a named type, it's really just an
  // object that can be reused in multiple locations.
  return {
    type,
    ...options,
  };
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GQLiteral layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function GQLiteralSchema(options: Types.SchemaConfig) {
  const typeMap = buildTypes(options);

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

  // Only in development do we want to worry about regenerating the
  // schema definition and/or generated types.
  if (process.env.NODE_ENV === "development") {
    if (options.definitionFilePath || options.typeGeneration) {
      const sortedSchema = lexicographicSortSchema(schema);
      const generatedSchema = printSchema(sortedSchema);
      if (options.definitionFilePath) {
        const fs = require("fs");
        fs.writeFile(
          options.definitionFilePath,
          generatedSchema,
          (err: Error | null) => {
            if (err) {
              return console.error(err);
            }
          }
        );
      }
      if (options.typeGeneration) {
        options
          .typeGeneration(sortedSchema)
          .then((options) => {
            console.log(options);
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
  }

  return schema;
}
