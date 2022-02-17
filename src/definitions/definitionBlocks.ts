import type { GraphQLFieldConfig, GraphQLFieldResolver, GraphQLInputFieldConfig } from 'graphql'
import { messages } from '../messages'
import type {
  AllInputTypes,
  FieldResolver,
  GetGen,
  GetGen3,
  HasGen3,
  NeedsResolver,
} from '../typegenTypeHelpers'
import type { ArgsRecord } from './args'
import type { NexusMetaType } from './nexusMeta'
import type { AllNexusInputTypeDefs, AllNexusOutputTypeDefs, NexusWrapKind } from './wrapping'
import type { BaseScalars, Maybe } from './_types'

export interface CommonFieldConfig {
  /** The description to annotate the GraphQL SDL */
  description?: Maybe<string>
  /**
   * Info about a field deprecation. Formatted as a string and provided with the deprecated directive on
   * field/enum types and as a comment on input fields.
   */
  deprecation?: Maybe<string> // | DeprecationInfo;
}

export type CommonOutputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /**
   * [GraphQL.org Docs](https://graphql.github.io/learn/schema/#arguments) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Language.Arguments)
   *
   * Define arguments for this field.
   *
   * All fields in GraphQL can have arguments defined for them. Nexus provides a number of helpers for
   * defining arguments. All builtin GraphQL scalar types have helpers named "{scalarName}Arg" such as
   * "stringArg" and "intArg". You can also use type modifier helpers "[list](https://nxs.li/docs/api/list)"
   * "[nullable](https://nxs.li/docs/api/nullable)" and "[nonNull](https://nxs.li/docs/api/nonNull)". For
   * details about nonNull/nullable refer to the [nullability guide](https://nxs.li/guides/nullability).
   *
   * @example
   *   export const Mutation = mutationType({
   *     definition(t) {
   *       t.field('createDraft', {
   *         type: 'Post',
   *         args: {
   *           title: nonNull(stringArg()),
   *           body: nonNull(stringArg()),
   *         },
   *         // ...
   *       })
   *     },
   *   })
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
   */
  args?: Maybe<ArgsRecord>
  /**
   * Data that will be added to the field-level [extensions field on the graphql-js type def
   * instances](https://github.com/graphql/graphql-js/issues/1527) resulting from makeSchema. Useful for some
   * graphql-js based tools like [join-monster](https://github.com/join-monster/join-monster) which rely on
   * looking for special data here.
   *
   * @example
   *   // taken from: https://github.com/graphql-nexus/schema/issues/683#issuecomment-735711640
   *
   *   const User = objectType({
   *     name: 'User',
   *     extensions: {
   *       joinMonster: {
   *         sqlTable: 'USERS',
   *         uniqueKey: 'USER_ID',
   *       },
   *     },
   *     definition(t) {
   *       t.id('id', {
   *         extensions: {
   *           joinMonster: {
   *             sqlColumn: 'USER_ID',
   *           },
   *         },
   *       })
   *     },
   *   })
   */
  extensions?: GraphQLFieldConfig<any, any>['extensions']
} & NexusGenPluginFieldConfig<TypeName, FieldName>

export type CommonInputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /** The default value for the field, if any */
  default?: GetGen3<'inputTypes', TypeName, FieldName>
  /**
   * Data that will be added to the field-level [extensions field on the graphql-js type def
   * instances](https://github.com/graphql/graphql-js/issues/1527) resulting from makeSchema. Useful for some
   * graphql-js based tools which rely on looking for special data here.
   */
  extensions?: GraphQLInputFieldConfig['extensions']
} & NexusGenPluginFieldConfig<TypeName, FieldName> &
  NexusGenPluginInputFieldConfig<TypeName, FieldName>
export interface OutputScalarConfig<TypeName extends string, FieldName extends string>
  extends CommonOutputFieldConfig<TypeName, FieldName> {
  /**
   * [GraphQL.org Docs](https://graphql.org/learn/execution/#root-fields-resolvers)
   *
   * The actual implementation for this field.
   *
   * Every field has a resolver and they are the basis for resolving queries at runtime. You do not need to
   * explicitly implement every resolver however. If the [source typing](https://nxs.li/guides/backing-types) includes:
   *
   * 1. A field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...then the default resolver will be available, whose behaviour is to simply return that field from the
   * received source type.
   *
   * @example
   *   export const Query = queryType({
   *     definition(t) {
   *       t.list.field('posts', {
   *         type: 'Post',
   *         resolve(_, __, ctx) {
   *           return ctx.db.post.findMany({ where: { published: true } })
   *         },
   *       })
   *     },
   *   })
   *
   * @param source The [source data](https://nxs.li/guides/source-types) for the GraphQL object that this
   *     field belongs to, unless this is a root field (any field on a [root operation
   *     type](https://spec.graphql.org/June2018/#sec-Root-Operation-Types): Query, Mutation, Subscription),
   *     in which case there is no source data and this will be undefined.
   * @param args If you have defined arguments on this field then this parameter will contain any arguments
   *     passed by the client. If you specified default values for any arguments and the client did not
   *     explicitly pass *any* value (including null) for those arguments then you will see the defaults here.
   *
   * Note that thanks to [Nexus' reflection system](https://nxs.li/guides/reflection) this parameter's type
   *     will always be type safe.
   * @param context The context data for this request.
   *
   * The context data is typically a singleton scoped to the lifecycle of the request. This means created at
   *     the beginning of a request and then passed to all the resolvers that execute while resolving the
   *     request. It is often used to store information like the current user making the request. Nexus is
   *     not responsible for this however. That is typically something you'll do with e.g.
   *     [Mercurius](https://mercurius.dev) or [Apollo
   *     Server](https://apollographql.com/docs/apollo-server/api/apollo-server).
   *
   * Note that the type here will be whatever you have specified for "contextType" in your makeSchema configuration.
   * @param info The GraphQL resolve info.
   *
   * This is an advanced parameter seldom used. It includes things like the AST of the [GraphQL
   *     document](https://spec.graphql.org/June2018/#sec-Language.Document) sent by the client.
   */
  resolve?: FieldResolver<TypeName, FieldName>
}

// prettier-ignore
export interface NexusOutputFieldConfig<TypeName extends string, FieldName extends string> extends OutputScalarConfig<TypeName, FieldName> {
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Types)
   *
   * The type that this field should be.
   *
   * Object type fields may be typed as scalars or other output types in your schema, often object types. They
   * may also use type modifiers like list and non-null types.
   *
   * Types may be expressed in one of three ways:
   *
   * 1. As string literals matching the name of a builtin scalar.
   *
   * 2. As string literals matching the name of another type. Thanks to [Nexus' reflection
   * system](https://nxs.li/guides/reflection) this is typesafe and autocompletable. This is the idiomatic
   * approach in Nexus because it avoids excessive importing and circular references.
   *
   * 3. As references to other enums or object type definitions.
   *
   * You may also use type modifier helpers like list() and nonNull() which in turn accept one of the three
   * methods listed above.
   *
   * Note that both type modifier and scalar helpers are available as chainable shorthands which you can see
   * in the examples below.
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('location', {
   *         // reference the friend type via typegen
   *         type: 'Location',
   *       })
   *     },
   *   })
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('location', {
   *         // reference the friend type via type def reference
   *         type: Location,
   *       })
   *     },
   *   })
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('friends', {
   *         // create a non-null list of non-null friends
   *         // using typegen type referencing
   *         type: nonNull(list(nonNull('Friend'))),
   *       })
   *     },
   *   })
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       // create a non-null list of non-null friends
   *       // using chaining API and typegen type referencing
   *       t.nonNull.list.nonNull.field('friends', {
   *         type: 'Friend',
   *       })
   *     },
   *   })
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('friends', {
   *         // create a non-null list of non-null friends
   *         // using type def referencing
   *         type: nonNull(list(nonNull(Friend))),
   *       })
   *     },
   *   })
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('id', {
   *         // Refer to builtin scalars by string reference
   *         type: 'ID',
   *       })
   *     },
   *   })
   */
  type: GetGen<'allOutputTypes', string> | AllNexusOutputTypeDefs | NexusMetaType
}

// prettier-ignore
export interface NexusOutputFieldConfigWithName<TypeName extends string, FieldName extends string> extends NexusOutputFieldConfig<TypeName, FieldName> {
  /**
   * The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   */
  name: FieldName
}

export type NexusOutputFieldDef = NexusOutputFieldConfig<string, any> & {
  name: string
  configFor: 'outputField'
  parentType: string
  subscribe?: GraphQLFieldResolver<any, any>
  wrapping?: NexusWrapKind[]
}

// prettier-ignore
export type ScalarOutSpread<TypeName extends string, FieldName extends string> =
  NeedsResolver<TypeName, FieldName> extends true
    ? [ScalarOutConfig<TypeName, FieldName>]
    : HasGen3<'argTypes', TypeName, FieldName> extends true
      ? [ScalarOutConfig<TypeName, FieldName>]
      : [ScalarOutConfig<TypeName, FieldName>] | []

// prettier-ignore
export type ScalarOutConfig<TypeName extends string, FieldName extends string> =
  NeedsResolver<TypeName, FieldName> extends true
    ? OutputScalarConfig<TypeName, FieldName> &
      {
        resolve: FieldResolver<TypeName, FieldName>
      }
    : OutputScalarConfig<TypeName, FieldName>

// prettier-ignore
export type FieldOutConfig<TypeName extends string, FieldName extends string> =
  NeedsResolver<TypeName, FieldName> extends true
    ? NexusOutputFieldConfig<TypeName, FieldName> & {
        resolve: FieldResolver<TypeName, FieldName>
      }
    : NexusOutputFieldConfig<TypeName, FieldName>

// prettier-ignore
export type FieldOutConfigWithName<TypeName extends string, FieldName extends string> =
  NeedsResolver<TypeName, FieldName> extends true
    ? NexusOutputFieldConfigWithName<TypeName, FieldName> & {
        resolve: FieldResolver<TypeName, FieldName>
      }
    : NexusOutputFieldConfigWithName<TypeName, FieldName>

export interface OutputDefinitionBuilder {
  typeName: string
  addField(config: NexusOutputFieldDef): void
  addDynamicOutputMembers(block: OutputDefinitionBlock<any>, wrapping?: NexusWrapKind[]): void
  warn(msg: string): void
}

export interface InputDefinitionBuilder {
  typeName: string
  addField(config: NexusInputFieldDef): void
  addDynamicInputFields(block: InputDefinitionBlock<any>, wrapping?: NexusWrapKind[]): void
  warn(msg: string): void
}

// prettier-ignore
export interface OutputDefinitionBlock<TypeName extends string>
       extends NexusGenCustomOutputMethods<TypeName>,
               NexusGenCustomOutputProperties<TypeName>
       {}

/** The output definition block is passed to the "definition" function property of the "objectType" / "interfaceType" */
export class OutputDefinitionBlock<TypeName extends string> {
  /** The name of the enclosing object type. */
  readonly typeName: string

  constructor(protected typeBuilder: OutputDefinitionBuilder, protected wrapping?: NexusWrapKind[]) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicOutputMembers(this, this.wrapping)
  }

  /**
   * [API Docs](https://nxs.li/docs/api/list) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Type-System.List)
   *
   * Chain this property to wrap the right-hand-side type (the field type, another list, nonNull, etc.) with a
   * List type.
   *
   * Chains are read backwards, right to left, like function composition. In other words the thing on the left
   * wraps the thing on the right.
   *
   * This is a shorthand equivalent to:
   *
   * `t.field('...', { type: list('...') })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.list.nonNull.string('aliases')
   *     },
   *   })
   *
   *   // GraphQL SDL
   *   // -----------
   *   //
   *   // type User {
   *   //   aliases: [String!]
   *   // }
   */
  get list() {
    return this._wrapClass('List')
  }

  /**
   * [API Docs](https://nxs.li/docs/api/nonNull) | [Nullability
   * Guide](https://nexusjs.org/docs/guides/nullability) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Type-System.Non-Null)
   *
   * Chain this property to wrap the right-hand-side type (the field type or a list) with a Non-Null type.
   *
   * In Nexus output types are nullable by default so this is useful to configure a field differently. Note if
   * you find yourself using this most of the time then what you probably what is to change the
   * nonNullDefaults configuration either globally in your makeSchema config or at the type definition level
   * in one of your type configs to be false for outputs.
   *
   * Chains are read backwards, right to left, like function composition. In other words the thing on the left
   * wraps the thing on the right.
   *
   * This is a shorthand equivalent to:
   *
   * `t.field('...', { type: nonNull('...') })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.nonNull.list.string('aliases')
   *     },
   *   })
   *
   *   // GraphQL SDL
   *   // -----------
   *   //
   *   // type User {
   *   //   aliases: [String]!
   *   // }
   */
  get nonNull(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('NonNull')
  }

  /**
   * [API Docs](https://nxs.li/docs/api/null) | [Nullability
   * Guide](https://nexusjs.org/docs/guides/nullability) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Type-System.Non-Null)
   *
   * Chain this property to *unwrap* the right-hand-side type (the field type or a list) of a Non-Null type.
   *
   * In Nexus output types are nullable by default so this is only useful when you have changed your
   * nonNullDefaults configuration either globally in your makeSchema config or at the type definition level
   * in one of your type configs to be false for outputs.
   *
   * Chains are read backwards, right to left, like function composition. In other words the thing on the left
   * wraps the thing on the right.
   *
   * This is a shorthand equivalent to:
   *
   * `t.field('...', { type: nullable('...') })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     nonNullDefaults: {
   *       outputs: true,
   *     },
   *     definition(t) {
   *       t.id('id')
   *       t.nullable.string('bio')
   *     },
   *   })
   *
   *   // GraphQL SDL
   *   // -----------
   *   //
   *   // type User {
   *   //   id: ID!
   *   //   bio: String
   *   // }
   */
  get nullable(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('Null')
  }

  /**
   * [GraphQL 2018 spec](https://spec.graphql.org/June2018/#sec-Boolean)
   *
   * Define a field whose type is Boolean.
   *
   * Boolean types are [scalars](https://spec.graphql.org/June2018/#sec-Scalars) representing true or false.
   * They are represented in JavaScript using the [boolean primitive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean).
   *
   * This is a shorthand equivalent to:
   *
   * `t.field('...', { type: boolean() })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.boolean('active')
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   *
   * This parameter is optional if no resolver is required. No resolver is required if the [source
   *     typing](https://nxs.li/guides/backing-types):
   *
   * 1. Has a field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...in which case the default resolver will be available whose behaviour is to simply return that field
   *     from the received source type.
   */
  boolean<FieldName extends string>(name: FieldName, ...config: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(name, 'Boolean', config)
  }

  /**
   * [GraphQL 2018 spec](https://spec.graphql.org/June2018/#sec-String)
   *
   * Define a field whose type is String.
   *
   * String types are [scalars](https://spec.graphql.org/June2018/#sec-Scalars) representing UTF-8 (aka.
   * unicode) character sequences. It is most often used to represent free-form human-readable text. They are
   * represented in JavaScript using the [string primitive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * This is a shorthand, equivalent to:
   *
   * `t.field('...', { type: string() })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.string('bio')
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   *
   * This parameter is optional if no resolver is required. No resolver is required if the [source
   *     typing](https://nxs.li/guides/backing-types):
   *
   * 1. Has a field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...in which case the default resolver will be available whose behaviour is to simply return that field
   *     from the received source type.
   */
  string<FieldName extends string>(name: FieldName, ...config: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(name, 'String', config)
  }

  /**
   * [GraphQL 2018 spec](https://spec.graphql.org/June2018/#sec-ID)
   *
   * Define a field whose type is ID.
   *
   * ID types are [scalars](https://spec.graphql.org/June2018/#sec-Scalars) representing unique identifiers
   * often used to refetch an object or as the key for a cache. It is serialized in the same way as the
   * [String](https://spec.graphql.org/June2018/#sec-String) type but unlike String not intended to be
   * human-readable. They are represented in JavaScript using the [string primitive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * This is a shorthand, equivalent to:
   *
   * `t.field('...', { type: id() })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.id('id')
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   *
   * This parameter is optional if no resolver is required. No resolver is required if the [source
   *     typing](https://nxs.li/guides/backing-types):
   *
   * 1. Has a field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...in which case the default resolver will be available whose behaviour is to simply return that field
   *     from the received source type.
   */
  id<FieldName extends string>(name: FieldName, ...config: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(name, 'ID', config)
  }

  /**
   * [GraphQL 2018 spec](https://spec.graphql.org/June2018/#sec-Int)
   *
   * Define a field whose type is Int.
   *
   * Int types are [scalars](https://spec.graphql.org/June2018/#sec-Scalars) representing a signed 32-bit
   * numeric non-fractional value. They are represented in JavaScript using the [number primitive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).
   *
   * This is a shorthand equivalent to:
   *
   * `t.field('...', { type: int() })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.int('age')
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   *
   * This parameter is optional if no resolver is required. No resolver is required if the [source
   *     typing](https://nxs.li/guides/backing-types):
   *
   * 1. Has a field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...in which case the default resolver will be available whose behaviour is to simply return that field
   *     from the received source type.
   */
  int<FieldName extends string>(name: FieldName, ...config: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(name, 'Int', config)
  }

  /**
   * [GraphQL 2018 spec](https://spec.graphql.org/June2018/#sec-Float)
   *
   * Define a field whose type is Float.
   *
   * Float types are [scalars](https://spec.graphql.org/June2018/#sec-Scalars) representing signed
   * double‐precision fractional values as specified by IEEE 754. They are represented in JavaScript using
   * the [number primitive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number).
   *
   * This is a shorthand, equivalent to:
   *
   * `t.field('...', { type: float() })`
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.float('height')
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   *
   * This parameter is optional if no resolver is required. No resolver is required if the [source
   *     typing](https://nxs.li/guides/backing-types):
   *
   * 1. Has a field whose name matches this one 2. And whose type is compatible 3. And is a scalar
   *
   * ...in which case the default resolver will be available whose behaviour is to simply return that field
   *     from the received source type.
   */
  float<FieldName extends string>(name: FieldName, ...config: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(name, 'Float', config)
  }

  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Language.Fields)
   *
   * Define a field on this object.
   *
   * A field describes one discrete piece of information available to request within a [selection
   * set](https://spec.graphql.org/June2018/#sec-Selection-Sets). They are in fact most of what any selection
   * set will contain. Fields can be typed as scalars (marking the terminal point of a branch of a selection
   * set) or as other object types in your schema thus allowing you to model relationships between things.
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field('id', {
   *         type: id(),
   *         description: 'The unique identification number for this user',
   *       })
   *     },
   *   })
   *
   * @param name The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   */
  field<FieldName extends string>(name: FieldName, config: FieldOutConfig<TypeName, FieldName>): void
  /**
   * [GraphQL 2018 Spec](https://spec.graphql.org/June2018/#sec-Language.Fields)
   *
   * Define a field on this object.
   *
   * A field describes one discrete piece of information available to request within a [selection
   * set](https://spec.graphql.org/June2018/#sec-Selection-Sets). They are in fact most of what any selection
   * set will contain. Fields can be typed as scalars (marking the terminal point of a branch of a selection
   * set) or as other object types in your schema thus allowing you to model relationships between things.
   *
   * @example
   *   objectType({
   *     name: 'User',
   *     definition(t) {
   *       t.field({
   *         name: 'id',
   *         type: id(),
   *         description: 'The unique identification number for this user',
   *       })
   *     },
   *   })
   *
   * @param config The configuration for things like the field's type, its description, its arguments, its
   *     resolver, and more. See jsdoc on each field within for details.
   */
  field<FieldName extends string>(config: FieldOutConfigWithName<TypeName, FieldName>): void
  field<FieldName extends string>(
    ...args:
      | [name: FieldName, config: FieldOutConfig<TypeName, FieldName>]
      | [config: FieldOutConfigWithName<TypeName, FieldName>]
  ): void {
    const config = args.length === 2 ? { name: args[0], ...args[1] } : args[0]

    this.typeBuilder.addField({
      ...config,
      configFor: 'outputField',
      wrapping: this.wrapping,
      parentType: this.typeName,
    } as any)
  }

  private _wrapClass(kind: NexusWrapKind): OutputDefinitionBlock<TypeName> {
    const previousWrapping = this.wrapping?.[0]
    if (
      (kind === 'NonNull' || kind === 'Null') &&
      (previousWrapping === 'NonNull' || previousWrapping === 'Null')
    ) {
      return new OutputDefinitionBlock(this.typeBuilder, this.wrapping || [])
    }
    return new OutputDefinitionBlock(this.typeBuilder, [kind].concat(this.wrapping || []))
  }

  private addScalarField<FieldName extends string>(
    fieldName: FieldName,
    typeName: BaseScalars,
    opts: [] | ScalarOutSpread<TypeName, any>
  ) {
    let fieldConfig: FieldOutConfig<any, any> = {
      type: typeName,
    }

    /* istanbul ignore if */
    if (typeof opts[0] === 'function') {
      throw new Error(messages.removedFunctionShorthand(typeName, fieldName))
    } else {
      fieldConfig = { ...fieldConfig, ...opts[0] }
    }

    this.field(fieldName, fieldConfig as any)
  }
}

/** TODO move the code below to definitionBlocks/input.ts Input */

// prettier-ignore
export interface NexusInputFieldConfig<TypeName extends string, FieldName extends string> extends CommonInputFieldConfig<TypeName, FieldName> {
  type: AllInputTypes | AllNexusInputTypeDefs
}

// prettier-ignore
export interface NexusInputFieldConfigWithName<TypeName extends string, FieldName extends string> extends NexusInputFieldConfig<TypeName, FieldName> {
  /**
   * The name of this field. Must conform to the regex pattern: [_A-Za-z][_0-9A-Za-z]*
   */
  name: FieldName
}

export type NexusInputFieldDef = NexusInputFieldConfig<string, string> & {
  configFor: 'inputField'
  name: string
  wrapping?: NexusWrapKind[]
  parentType: string
}

export interface InputDefinitionBlock<TypeName extends string> extends NexusGenCustomInputMethods<TypeName> {}

export class InputDefinitionBlock<TypeName extends string> {
  readonly typeName: string
  constructor(protected typeBuilder: InputDefinitionBuilder, protected wrapping?: NexusWrapKind[]) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicInputFields(this, this.wrapping)
  }

  get list() {
    return this._wrapClass('List')
  }

  get nonNull(): Omit<InputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('NonNull')
  }

  get nullable(): Omit<InputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('Null')
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    config?: CommonInputFieldConfig<TypeName, FieldName>
  ) {
    this.field(fieldName, { ...config, type: 'String' })
  }

  int<FieldName extends string>(fieldName: FieldName, config?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...config, type: 'Int' })
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    opts?: CommonInputFieldConfig<TypeName, FieldName>
  ) {
    this.field(fieldName, { ...opts, type: 'Boolean' })
  }

  id<FieldName extends string>(fieldName: FieldName, config?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...config, type: 'ID' })
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    config?: CommonInputFieldConfig<TypeName, FieldName>
  ) {
    this.field(fieldName, { ...config, type: 'Float' })
  }

  field<FieldName extends string>(config: NexusInputFieldConfigWithName<TypeName, FieldName>): void
  field<FieldName extends string>(name: FieldName, config: NexusInputFieldConfig<TypeName, FieldName>): void
  field<FieldName extends string>(
    ...args:
      | [FieldName, NexusInputFieldConfig<TypeName, FieldName>]
      | [NexusInputFieldConfigWithName<TypeName, FieldName>]
  ): void {
    const config = args.length === 2 ? { name: args[0], ...args[1] } : args[0]

    this.typeBuilder.addField({
      ...config,
      wrapping: this.wrapping,
      parentType: this.typeName,
      configFor: 'inputField',
    })
  }

  private _wrapClass(kind: NexusWrapKind) {
    const previousWrapping = this.wrapping?.[0]
    if (
      (kind === 'NonNull' || kind === 'Null') &&
      (previousWrapping === 'NonNull' || previousWrapping === 'Null')
    ) {
      return new InputDefinitionBlock(this.typeBuilder, this.wrapping || [])
    }
    return new InputDefinitionBlock(this.typeBuilder, [kind].concat(this.wrapping || []))
  }
}
