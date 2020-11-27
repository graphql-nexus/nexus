import { GraphQLFieldResolver } from 'graphql'
import { AllInputTypes, FieldResolver, GetGen, GetGen3, HasGen3, NeedsResolver } from '../typegenTypeHelpers'
import { ArgsRecord } from './args'
import { AllNexusInputTypeDefs, AllNexusOutputTypeDefs, NexusWrapKind } from './wrapping'
import { BaseScalars } from './_types'
import { messages } from '../messages'

export interface CommonFieldConfig {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
}

export type CommonOutputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /**
   * Arguments for the field
   */
  args?: ArgsRecord
} & NexusGenPluginFieldConfig<TypeName, FieldName>

export type CommonInputFieldConfig<TypeName extends string, FieldName extends string> = CommonFieldConfig & {
  /**
   * The default value for the field, if any
   */
  default?: GetGen3<'inputTypes', TypeName, FieldName>
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
  /**
   * Resolve method for the field
   */
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

/**
 * The output definition block is passed to the "definition"
 * function property of the "objectType" / "interfaceType"
 */
export class OutputDefinitionBlock<TypeName extends string> {
  readonly typeName: string
  constructor(protected typeBuilder: OutputDefinitionBuilder, protected wrapping?: NexusWrapKind[]) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicOutputMembers(this, this.wrapping)
  }

  get list() {
    return this._wrapClass('List')
  }

  get nonNull(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('NonNull')
  }

  get nullable(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    return this._wrapClass('Null')
  }

  string<FieldName extends string>(fieldName: FieldName, ...opts: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'String', opts)
  }

  int<FieldName extends string>(fieldName: FieldName, ...opts: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'Int', opts)
  }

  boolean<FieldName extends string>(fieldName: FieldName, ...opts: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'Boolean', opts)
  }

  id<FieldName extends string>(fieldName: FieldName, ...opts: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'ID', opts)
  }

  float<FieldName extends string>(fieldName: FieldName, ...opts: ScalarOutSpread<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'Float', opts)
  }

  field<FieldName extends string>(name: FieldName, fieldConfig: FieldOutConfig<TypeName, FieldName>) {
    this.typeBuilder.addField({
      name,
      ...fieldConfig,
      configFor: 'outputField',
      wrapping: this.wrapping,
      parentType: this.typeName,
    } as any)
  }

  protected _wrapClass(kind: NexusWrapKind): OutputDefinitionBlock<TypeName> {
    const previousWrapping = this.wrapping?.[0]
    if (
      (kind === 'NonNull' || kind === 'Null') &&
      (previousWrapping === 'NonNull' || previousWrapping === 'Null')
    ) {
      return new OutputDefinitionBlock(this.typeBuilder, this.wrapping || [])
    }
    return new OutputDefinitionBlock(this.typeBuilder, [kind].concat(this.wrapping || []))
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: [] | ScalarOutSpread<TypeName, any>
  ) {
    let config: NexusOutputFieldDef = {
      name: fieldName,
      type: typeName,
      parentType: this.typeName,
      configFor: 'outputField',
    }

    /* istanbul ignore if */
    if (typeof opts[0] === 'function') {
      config.resolve = opts[0] as any
      console.warn(messages.removedFunctionShorthand(typeName, fieldName))
    } else {
      config = { ...config, ...opts[0] }
    }

    this.typeBuilder.addField({
      ...config,
      wrapping: this.wrapping,
    })
  }
}

export interface NexusInputFieldConfig<TypeName extends string, FieldName extends string>
  extends CommonInputFieldConfig<TypeName, FieldName> {
  type: AllInputTypes | AllNexusInputTypeDefs<string>
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
    this.addScalarField(fieldName, 'String', opts)
  }

  int<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'Int', opts)
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    opts?: CommonInputFieldConfig<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, 'Boolean', opts)
  }

  id<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'ID', opts)
  }

  float<FieldName extends string>(fieldName: FieldName, opts?: CommonInputFieldConfig<TypeName, FieldName>) {
    this.addScalarField(fieldName, 'Float', opts)
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

  protected _wrapClass(kind: NexusWrapKind) {
    const previousWrapping = this.wrapping?.[0]
    if (
      (kind === 'NonNull' || kind === 'Null') &&
      (previousWrapping === 'NonNull' || previousWrapping === 'Null')
    ) {
      return new InputDefinitionBlock(this.typeBuilder, this.wrapping || [])
    }
    return new InputDefinitionBlock(this.typeBuilder, [kind].concat(this.wrapping || []))
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: CommonInputFieldConfig<any, any> = {}
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      type: typeName,
      ...opts,
      wrapping: this.wrapping,
      parentType: this.typeName,
      configFor: 'inputField',
    })
  }
}
