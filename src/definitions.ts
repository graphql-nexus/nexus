import { assertValidName, GraphQLScalarType } from "graphql";
import {
  DirectiveTypeDef,
  EnumTypeDef,
  InputObjectTypeDef,
  InterfaceTypeDef,
  ObjectTypeDef,
  UnionTypeDef,
  WrappedType,
} from "./core";
import * as Types from "./types";
import { enumShorthandMembers } from "./utils";

/**
 * The most basic components of a GraphQL schema are object types, which just represent
 * a kind of object you can fetch from your service, and what fields it has.
 *
 * ```
 * const User = objectType('User', (t) => {
 *   t.int('id', { description: 'Id of the user' })
 *   t.string('fullName', { description: 'Full name of the user' })
 *   t.field('status', 'StatusEnum');
 *   t.field('posts', 'Post', {
 *     list: true,
 *     resolve(root, args, ctx) {
 *       return ctx.getUser(root.id).posts()
 *     }
 *   })
 * });
 *
 * const Post = objectType('Post', (t) => {
 *   t.int('id')
 *   t.string('title')
 * })
 *
 * const StatusEnum = enumType('StatusEnum', {
 *   ACTIVE: 1,
 *   DISABLED: 2
 * });
 * ```
 *
 * @see https://graphql.github.io/learn/schema/#object-types-and-fields
 */
export function objectType<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (t: ObjectTypeDef<GenTypes, TypeName>) => void
): WrappedType {
  const factory = new ObjectTypeDef<GenTypes, TypeName>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

/**
 * Like many type systems, GraphQL supports interfaces. An Interface is an
 * abstract type that includes a certain set of fields that a type must
 * include to implement the interface.
 *
 * In GraphQL Nexus, you do not need to redefine the interface fields on the
 * implementing object types, instead you may use `.implements(interfaceName)`
 * and all of the interface fields will be added to the type.
 *
 * ```
 * const Node = interfaceType('Node', t => {
 *   t.id('id', { description: 'GUID for a resource' });
 * });
 *
 * const User = objectType('User', t => {
 *   t.implements('Node');
 * });
 * ```
 *
 * @see https://graphql.github.io/learn/schema/#interfaces
 */
export function interfaceType<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (t: InterfaceTypeDef<GenTypes, TypeName>) => void
): WrappedType {
  const factory = new InterfaceTypeDef<GenTypes, TypeName>(
    assertValidName(name)
  );
  fn(factory);
  return new WrappedType(factory);
}

/**
 * Union types are very similar to interfaces, but they don't get to specify
 * any common fields between the types.
 *
 * As a function, where other unions can be mixed in:
 *
 * ```
 * const CombinedResult = unionType('CombinedResult', t => {
 *   t.mix('SearchResult')
 *   t.members('AnotherType', 'YetAnotherType')
 *   t.resolveType(item => item.name)
 * })
 * ```
 *
 * @see https://graphql.org/learn/schema/#union-types
 */
export function unionType<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn: (t: UnionTypeDef<GenTypes, TypeName>) => void
): WrappedType {
  const factory = new UnionTypeDef<GenTypes>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

/**
 * A Enum is a special GraphQL type that represents a set of symbolic names (members)
 * bound to unique, constant values. There are three ways to create a GraphQLEnumType
 * with enumType:
 *
 * As an array of enum values:
 *
 * ```
 * const Episode = enumType('Episode', ['NEWHOPE', 'EMPIRE', 'JEDI'])
 * ```
 *
 * As an object, with a mapping of enum values to internal values:
 *
 * ```
 * const Episode = enumType('Episode', {
 *   NEWHOPE: 4,
 *   EMPIRE: 5,
 *   JEDI: 6
 * });
 * ```
 *
 * As a function, where other enums can be mixed in:
 *
 * ```
 * const Episode = enumType('Episode', (t) => {
 *   t.mix('OneThroughThree')
 *   t.mix('FourThroughSix')
 *   t.mix('SevenThroughNine')
 *   t.members(['OTHER'])
 *   t.description('All Movies in the Skywalker saga, or OTHER')
 * })
 * ```
 *
 * @see https://graphql.github.io/learn/schema/#enumeration-types
 */
export function enumType<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
>(
  name: TypeName,
  fn:
    | ((arg: EnumTypeDef<GenTypes>) => void)
    | string[]
    | Record<string, string | number | object | boolean>
): WrappedType {
  const factory = new EnumTypeDef<GenTypes>(assertValidName(name));
  if (typeof fn === "function") {
    fn(factory);
  } else {
    factory.members(enumShorthandMembers(fn));
  }
  return new WrappedType(factory);
}

/**
 * Defines a complex object which can be passed as an input value.
 *
 * Unlike object types, input types do not have arguments, and they do not
 * have resolvers, backing types, etc.
 *
 * @see https://graphql.org/learn/schema/#input-types
 */
export function inputObjectType<
  GenTypes = GraphQLNexusGen,
  TypeName extends string = any
>(name: TypeName, fn: (t: InputObjectTypeDef<GenTypes>) => void): WrappedType {
  const factory = new InputObjectTypeDef<GenTypes>(assertValidName(name));
  fn(factory);
  return new WrappedType(factory);
}

/**
 * A GraphQL object type has a name and fields, but at some point those fields have
 * to resolve to some concrete data. That's where the scalar types come in:
 * they represent the leaves of the query.
 *
 * ```js
 * const DateScalar = scalarType("Date", {
 *   description: "Date custom scalar type",
 *   parseValue(value) {
 *     return new Date(value);
 *   },
 *   serialize(value) {
 *     return value.getTime();
 *   },
 *   parseLiteral(ast) {
 *     if (ast.kind === Kind.INT) {
 *       return new Date(ast.value);
 *     }
 *     return null;
 *   }
 * });
 * ```
 *
 * @see https://graphql.github.io/learn/schema/#scalar-types
 */
export function scalarType(
  name: string,
  options: Types.ScalarOpts
): WrappedType {
  return new WrappedType(
    new GraphQLScalarType({ name: assertValidName(name), ...options })
  );
}

/**
 * Defines an argument that can be used in any object or interface type
 *
 * Takes the GraphQL type name and any options.
 *
 * The value returned from this argument can be used multiple times in any valid `args` object value
 *
 * @see https://graphql.github.io/learn/schema/#arguments
 */
export function arg<GenTypes = GraphQLNexusGen>(
  type: Types.GetGen<GenTypes, "inputNames"> | Types.BaseScalars,
  options?: Types.ArgOpts
): Types.ArgDefinition {
  // This isn't wrapped for now because it's not a named type, it's really
  // just an object that can be reused in multiple locations.
  return {
    type,
    ...options,
  };
}

/**
 * Alias for `arg("String", options)`
 */
export function stringArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("String", options);
}

/**
 * Alias for `arg("Int", options)`
 */
export function intArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Int", options);
}

/**
 * Alias for `arg("Float", options)`
 */
export function floatArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Float", options);
}

/**
 * Alias for `arg("ID", options)`
 */
export function idArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("ID", options);
}

/**
 * Alias for `arg("Boolean", options)`
 */
export function booleanArg(options?: Types.ArgOpts): Types.ArgDefinition {
  return arg("Boolean", options);
}

/**
 * Defines a directive that can be used by the schema.
 *
 * > Note: Directives should be rarely used, as they only function for external
 * > consumers of the schema.
 */
export function directiveType<
  GenTypes = GraphQLNexusGen,
  DirectiveName extends string = any
>(
  name: DirectiveName,
  config:
    | Types.DirectiveConfig<GenTypes, DirectiveName>
    | ((arg: DirectiveTypeDef<GenTypes>) => void)
): WrappedType {
  const directive = new DirectiveTypeDef<GenTypes>(assertValidName(name));
  if (typeof config === "function") {
    config(directive);
  } else {
    directive.locations(...config.locations);
  }
  return new WrappedType(directive);
}
