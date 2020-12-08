import { GraphQLFieldConfig, GraphQLFieldResolver, GraphQLInputFieldConfig } from 'graphql'
import { messages } from '../messages'
import { AllInputTypes, FieldResolver, GetGen, GetGen3, HasGen3, NeedsResolver } from '../typegenTypeHelpers'
import { ArgsRecord } from './args'
import { AllNexusInputTypeDefs, AllNexusOutputTypeDefs, NexusWrapKind } from './wrapping'
import { BaseScalars } from './_types'

export interface CommonFieldConfig {
  /** The description to annotate the GraphQL SDL */
  description?: string | null
  /**
   * Info about a field deprecation. Formatted as a string and provided with the deprecated directive on
   * field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
}

export type CommonOutputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /** Arguments for the field */
  args?: ArgsRecord
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLFieldConfig<any, any>['extensions']
} & NexusGenPluginFieldConfig<TypeName, FieldName>

export type CommonInputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /** The default value for the field, if any */
  default?: GetGen3<'inputTypes', TypeName, FieldName>
  /**
   * Custom extensions, as supported in graphql-js
   *
   * @see https://github.com/graphql/graphql-js/issues/1527
   */
  extensions?: GraphQLInputFieldConfig['extensions']
} & NexusGenPluginFieldConfig<TypeName, FieldName>

/**
 * Deprecated, prefer core.CommonInputFieldConfig
 *
 * TODO(tim): Remove at 1.0
 */
export interface ScalarInputFieldConfig<T> extends CommonInputFieldConfig<any, any> {
  default?: T
}

export interface OutputScalarConfig<TypeName extends string, FieldName extends string>
  extends CommonOutputFieldConfig<TypeName, FieldName> {
  /** Resolve method for the field */
  resolve?: FieldResolver<TypeName, FieldName>
}

export interface NexusOutputFieldConfig<TypeName extends string, FieldName extends string>
  extends OutputScalarConfig<TypeName, FieldName> {
  type: GetGen<'allOutputTypes', string> | AllNexusOutputTypeDefs
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

export type FieldOutConfig<TypeName extends string, FieldName extends string> = NeedsResolver<
  TypeName,
  FieldName
> extends true
  ? NexusOutputFieldConfig<TypeName, FieldName> & {
      resolve: FieldResolver<TypeName, FieldName>
    }
  : NexusOutputFieldConfig<TypeName, FieldName>

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
   * [API Docs](https://nxs.li/docs/api/nonNull) | [Nexus Nullability
   * Guide](https://nexusjs.org/docs/guides/nullability) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Type-System.Non-Null)
   *
   * Chain this property to wrap the right-hand-side type (the field type or a list) with a Non-Null type.
   *
   * In Nexus output types are nullable by default so this is useful to configure a field differently. Note if
   * you find yourself using this most of the time then what you probably what is to change the
   * nonNullDefaults configuration either gloally in your makeSchema config or at the type definition level
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
   * [API Docs](https://nxs.li/docs/api/null) | [Nexus Nullability
   * Guide](https://nexusjs.org/docs/guides/nullability) | [GraphQL 2018
   * Spec](https://spec.graphql.org/June2018/#sec-Type-System.Non-Null)
   *
   * Chain this property to _unwrap_ the right-hand-side type (the field type or a list) of a Non-Null type.
   *
   * In Nexus output types are nullable by default so this is only useful when you have changed your
   * nonNullDefaults configuration either gloally in your makeSchema config or at the type definition level
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
   * ` t.field('...', { type: boolean() }) `
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
   *     typing](https://nxs.li/guides/backing-types) includes a field whose name matches this one and whose
   *     type is compatable. The default resolver behaviour will be to simply return that field from the
   *     received source type.
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
   * represented in JavaScript using the [string priimtive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * This is a shorthand, equivalent to:
   *
   * ` t.field('...', { type: string() }) `
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
   *     typing](https://nxs.li/guides/backing-types) includes a field whose name matches this one and whose
   *     type is compatable. The default resolver behaviour will be to simply return that field from the
   *     received source type.
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
   * human-readable. They are represented in JavaScript using the [string priimtive
   * type](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String).
   *
   * This is a shorthand, equivalent to:
   *
   * ` t.field('...', { type: id() }) `
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
   *     typing](https://nxs.li/guides/backing-types) includes a field whose name matches this one and whose
   *     type is compatable. The default resolver behaviour will be to simply return that field from the
   *     received source type.
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
   * ` t.field('...', { type: int() }) `
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
   *     typing](https://nxs.li/guides/backing-types) includes a field whose name matches this one and whose
   *     type is compatable. The default resolver behaviour will be to simply return that field from the
   *     received source type.
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
   * ` t.field('...', { type: float() }) `
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
   *     typing](https://nxs.li/guides/backing-types) includes a field whose name matches this one and whose
   *     type is compatable. The default resolver behaviour will be to simply return that field from the
   *     received source type.
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
   * @param config The configuration for things like the field's type, its description, its arguments,
   *     its resolver, and more. See jsdoc on each field within for details.
   */
  field<FieldName extends string>(name: FieldName, config: FieldOutConfig<TypeName, FieldName>) {
    this.typeBuilder.addField({
      name,
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
      fieldConfig.resolve = opts[0] as any
      console.warn(messages.removedFunctionShorthand(typeName, fieldName))
    } else {
      fieldConfig = { ...fieldConfig, ...opts[0] }
    }

    this.field(fieldName, fieldConfig as any)
  }
}

export interface NexusInputFieldConfig<TypeName extends string, FieldName extends string>
  extends CommonInputFieldConfig<TypeName, FieldName> {
  type: AllInputTypes | AllNexusInputTypeDefs
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

  string<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...opts, type: 'String' })
  }

  int<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...opts, type: 'Int' })
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    opts?: CommonInputFieldConfig<TypeName, FieldName>
  ) {
    this.field(fieldName, { ...opts, type: 'Boolean' })
  }

  id<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...opts, type: 'ID' })
  }

  float<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.field(fieldName, { ...opts, type: 'Float' })
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldConfig: NexusInputFieldConfig<TypeName, FieldName>
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      ...fieldConfig,
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
