import {
  GraphQLSchema,
  isNamedType,
  GraphQLNamedType,
  isObjectType,
} from "graphql";
import * as Types from "./types";
import * as Factories from "./factories";

/**
 * Wraps a GQLitType object, since all GQLit types have a
 * name, but that name isn't relevant to the type object until it's
 * constructed so we don't want it as a public member, purely for
 * intellisense/cosmetic purposes :)
 */
export class GQLitTypeWrapper<T extends Factories.GQLitType> {
  constructor(readonly name: string, readonly type: T) {}
}

/**
 * Defines a GraphQL Scalar type
 *
 * @param {string} name
 * @param {object} options
 */
export function GQLitScalar(name: string, options: Types.GQLitScalarOptions) {
  return new GQLitTypeWrapper(name, new Factories.GQLitScalarType(options));
}

/**
 * Defines a GraphQL object
 *
 * @param {string}
 */
export function GQLitObject<Root = any, Schema = any>(
  name: string,
  fn: (arg: Factories.GQLitObjectType<Root, Schema>) => void
) {
  const factory = new Factories.GQLitObjectType<Root, Schema>();
  fn(factory);
  return new GQLitTypeWrapper(name, factory);
}

/**
 * Define a GraphQL interface type
 */
export function GQLitInterface<Root = any, Schema = any>(
  name: string,
  fn: (arg: Factories.GQLitInterfaceType<Root, Schema>) => void
) {
  const factory = new Factories.GQLitInterfaceType();
  fn(factory);
  return new GQLitTypeWrapper(name, factory);
}

/**
 * Union types are very similar to interfaces, but they don't get to specify
 * any common fields between the types.
 *
 * There are two ways to create a GraphQLUnionType with GQLitUnion:
 *
 * As an array of types to satisfy the union:
 *
 * const SearchResult = GQLitUnion('SearchResult', ['Human', 'Droid', 'Starship'])
 *
 * As a function, where other unions can be mixed in:
 *
 * const CombinedResult = GQLitUnion('CombinedResult', t => {
 *   t.mix('SearchResult')
 *   t.types()
 * })
 */
export function GQLitUnion(
  name: string,
  fn: (arg: Factories.GQLitUnionType) => void
) {
  const factory = new Factories.GQLitUnionType();
  fn(factory);
  return new GQLitTypeWrapper(name, factory);
}

/**
 * A Enum is a special GraphQL type that represents a set of symbolic names (members)
 * bound to unique, constant values. There are three ways to create a GraphQLEnumType
 * with GQLitEnum:
 *
 * As an array of enum values:
 *
 * const Episode = GQLitEnum('Episode', ['NEWHOPE', 'EMPIRE', 'JEDI'])
 *
 * As an object, with a mapping of enum values to internal values:
 *
 * const Episode = GQLitEnum('Episode', {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * });
 *
 * As a function, where other enums can be mixed in:
 *
 * const Episode = GQLitEnum('Episode', (t) => {
 *   t.mix('OneThroughThree')
 *   t.mix('FourThroughSix')
 *   t.mix('SevenThroughNine')
 *   t.member({value: 'OTHER'})
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 */
export function GQLitEnum(
  name: string,
  fn: ((arg: Factories.GQLitEnumType) => void) | string[] | Record<string, any>
) {
  const toCall = typeof fn === "function" ? fn : addEnumValue(fn);
  const factory = new Factories.GQLitEnumType();
  toCall(factory);
  return new GQLitTypeWrapper(name, factory);
}

/**
 * Handles the shorhand syntax for creating the GraphQL schema
 */
const addEnumValue = (arg: string[] | Record<string, any>) => (
  f: Factories.GQLitEnumType
) => {
  if (Array.isArray(arg)) {
    arg.forEach(value => {
      f.member({ value });
    });
  } else {
    Object.keys(arg).forEach(value => {
      f.member({ value: value, internalValue: arg[value] });
    });
  }
};

/**
 *
 */
export function GQLitInputObject(
  name: string,
  fn: (arg: Factories.GQLitInputObjectType) => void
) {
  const factory = new Factories.GQLitInputObjectType();
  fn(factory);
  return new GQLitTypeWrapper(name, factory);
}

/**
 * A `GQLitAbstract` object contains fields that can be shared among
 * `GQLitObject`, `GQLitInterface`, `GQLitInputObject` or other `GQLitAbstract` types.
 *
 * Unlike concrete GraphQL types (types that show up in the generated schema),
 * GQLitAbstract types must be mixed in using the actual JS object returned by this
 * function rather than a string "name" representing the type.
 *
 * @return GQLitAbstractType
 */
export function GQLitAbstract(fn: (arg: Factories.GQLitAbstractType) => void) {
  const factory = new Factories.GQLitAbstractType();
  fn(factory);

  // This is not wrapped in a type, since it's not actually a concrete type.
  return factory;
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GQLit layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function GQLitSchema(options: Types.GQLitSchemaConfig) {
  const typeMap = gqlitBuildTypes(options.types);

  if (!isObjectType(typeMap["Query"])) {
    throw new Error("Missing a Query type.");
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

/**
 * Builds all of the types, properly accounts for any enums using "mix".
 * Since the enum types are resolved synchronously, these need to guard for circular references.
 */
export function gqlitBuildTypes(
  types: any[]
): Record<string, GraphQLNamedType> {
  const finalTypeMap: Record<string, GraphQLNamedType> = {};
  const pendingTypeMap: Record<
    string,
    ((building: Set<string>) => GraphQLNamedType) | null
  > = {};

  types.forEach(typeDef => {
    if (typeDef instanceof GQLitTypeWrapper) {
      pendingTypeMap[typeDef.name] = currentlyBuilding => {
        finalTypeMap[typeDef.name] = Factories.buildGQLitType(
          typeDef.name,
          typeDef.type,
          {
            finalTypeMap,
            pendingTypeMap,
            currentlyBuilding,
          }
        );
        pendingTypeMap[typeDef.name] = null;
        return finalTypeMap[typeDef.name];
      };
    } else if (isNamedType(typeDef)) {
      finalTypeMap[typeDef.name] = typeDef;
    }
  });

  Object.keys(pendingTypeMap).forEach(key => {
    const pending = pendingTypeMap[key];
    if (pending !== null) {
      pending(new Set());
    }
  });

  return finalTypeMap;
}
