import type { GraphQLScalarTypeConfig } from 'graphql'
import type { AllInputTypes, GetGen2 } from '../typegenTypeHelpers'
import type { AllNexusArgsDefs, AllNexusInputTypeDefs } from './wrapping'
import { Maybe, NexusTypes, withNexusSymbol } from './_types'

export type ArgsRecord = Record<string, AllNexusArgsDefs>

export type CommonArgConfig = {
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Descriptions)
   *
   * The description for this argument.
   *
   * Various GraphQL tools will make use of this information but it has zero runtime impact. The value given
   * here will also be included as heredocs in the generated GraphQL SDL file.
   *
   * Default :: By default there will be no description
   *
   * @example
   *   export const Query = queryType({
   *     definition(t) {
   *       t.list.int('connectionCount', {
   *         args: {
   *           lastSeconds: intArg({
   *             description: 'Limit count to this number of past seconds from now.',
   *           }),
   *         },
   *       })
   *     },
   *   })
   *
   *   // GraphQL SDL
   *   // -----------
   *   //
   *   // type Query {
   *   //   connectionCount(
   *   //   """Limit count to this number of past seconds from now."""
   *   //    lastSeconds: Int
   *   //   ): [Int]
   *   // }
   */
  description?: Maybe<string>

  /**
   * Data that will be added to the arg-level [extensions field on the graphql-js type def
   * instances](https://github.com/graphql/graphql-js/issues/1527) resulting from makeSchema. Useful for some
   * graphql-js based tools which rely on looking for special data here.
   */
  extensions?: GraphQLScalarTypeConfig<any, any>['extensions']
} & NexusGenPluginArgConfig

export interface ScalarArgConfig<T> extends CommonArgConfig {
  /**
   * The default value for this argument when ***none*** is given by the client.
   *
   * Note that *null* is still considered something meaning if the client gives an explicit null that will
   * prevent the default from activating. This is why the type of an arg with a default value in the resolver
   * includes "undefined | null".
   *
   * @example
   *   intArg({ default: 42 })
   */
  default?: T
}

export type NexusArgConfigType<T extends string> = T | AllNexusInputTypeDefs<T>

export interface NexusAsArgConfig<T extends string> extends CommonArgConfig {
  /**
   * Sets the default value for this argument, should match the type of the argument
   *
   * @example
   *   intArg({ default: 42 })
   */
  default?: GetGen2<'inputTypeShapes', T>
}

export interface NexusArgConfig<T extends string> extends NexusAsArgConfig<T> {
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Types)
   *
   * The type that this argument should be.
   *
   * Argument types may be scalars or other input types (input objects, enums) in your schema and modified
   * with non-null and list types.
   *
   * Types may be expressed in one of three ways:
   *
   * 1. As string literals matching the name of a builtin scalar. 2. As string literals matching the name of
   * another type. Thanks to [Nexus' reflection
   *     system](https://nxs.li/guides/reflection) this is typesafe and autocompletable. 3. As references to other
   * enums or input object type definitions.
   *
   * Type modifier helpers like list() may also be used and in turn accept one of the three methods listed above.
   *
   * @example
   *   arg({ type: 'UserCreateInput' })
   *
   * @example
   *   arg({ type: nonNull(list(nonNull('UserCreateInput'))) })
   *
   * @example
   *   arg({ type: UserCreateInput })
   *
   * @example
   *   arg({ type: nonNull(list(nonNull(UserCreateInput))) })
   *
   * @example
   *   arg({ type: 'String' })
   */
  type: NexusArgConfigType<T>
}

export interface NexusFinalArgConfig extends NexusArgConfig<any> {
  configFor: 'arg'
  argName: string
  fieldName: string
  parentType: string
}

export class NexusArgDef<TypeName extends AllInputTypes> {
  constructor(readonly name: TypeName, protected config: NexusArgConfig<any>) {}
  get value() {
    return this.config
  }
}
withNexusSymbol(NexusArgDef, NexusTypes.Arg)

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define an argument. Arguments can be used with the args config of any field.
 *
 * @example
 *   export const Mutation = mutationType({
 *     definition(t) {
 *       t.field('createDraft', {
 *         type: 'Post',
 *         args: {
 *           title: arg({
 *             type: 'String',
 *             default: 'Untitled',
 *             description: 'The title of this draft post.',
 *           }),
 *           body: nonNull(
 *             arg({
 *               type: 'String',
 *               description: 'The content of this draft post.',
 *             })
 *           ),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its type and description. See jsdoc on each config field
 *     for details.
 */
export function arg<T extends string>(config: NexusArgConfig<T>) {
  if (!config.type) {
    throw new Error('You must provide a "type" for the arg()')
  }
  return new NexusArgDef(typeof config.type === 'string' ? config.type : (config.type as any).name, config)
}

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define a string argument. Arguments can be used with the args config of any field.
 *
 * This is a shorthand equivalent to:
 *
 * `arg({ type: 'String', ... })`
 *
 * @example
 *   export const Mutation = mutationType({
 *     definition(t) {
 *       t.field('createDraft', {
 *         type: 'Post',
 *         args: {
 *           title: stringArg(),
 *           body: stringArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its description. See jsdoc on each config field for details.
 */
export function stringArg(config?: ScalarArgConfig<string>) {
  return arg({ type: 'String', ...config })
}

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define a string argument. Arguments can be used with the args config of any field.
 *
 * This is a shorthand equivalent to:
 *
 * `arg({ type: 'Int', ... })`
 *
 * @example
 *   export const Query = queryType({
 *     definition(t) {
 *       t.field('search', {
 *         type: 'SearchResult',
 *         args: {
 *           maxResults: intArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its description. See jsdoc on each config field for details.
 */
export function intArg(config?: ScalarArgConfig<number>) {
  return arg({ type: 'Int', ...config })
}

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define a string argument. Arguments can be used with the args config of any field.
 *
 * This is a shorthand equivalent to:
 *
 * `arg({ type: 'Float', ... })`
 *
 * @example
 *   export const Query = queryType({
 *     definition(t) {
 *       t.field('search', {
 *         type: 'SearchResult',
 *         args: {
 *           ratingAbove: floatArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its description. See jsdoc on each config field for details.
 */
export function floatArg(config?: ScalarArgConfig<number>) {
  return arg({ type: 'Float', ...config })
}

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define a string argument. Arguments can be used with the args config of any field.
 *
 * This is a shorthand equivalent to:
 *
 * `arg({ type: 'ID', ... })`
 *
 * @example
 *   export const Query = queryType({
 *     definition(t) {
 *       t.field('user', {
 *         type: 'User',
 *         args: {
 *           id: idArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its description. See jsdoc on each config field for details.
 */
export function idArg(config?: ScalarArgConfig<string>) {
  return arg({ type: 'ID', ...config })
}

/**
 * [API Docs](https://nexusjs.org/docs/api/args) | [GraphQL.org
 * Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
 * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
 *
 * Define a string argument. Arguments can be used with the args config of any field.
 *
 * This is a shorthand equivalent to:
 *
 * `arg({ type: 'Boolean', ... })`
 *
 * @example
 *   export const Query = queryType({
 *     definition(t) {
 *       t.list.field('users', {
 *         type: 'User',
 *         args: {
 *           active: booleanArg(),
 *         },
 *         // ...
 *       })
 *     },
 *   })
 *
 * @param config Configuration for the argument like its description. See jsdoc on each config field for details.
 */
export function booleanArg(config?: ScalarArgConfig<boolean>) {
  return arg({ type: 'Boolean', ...config })
}
