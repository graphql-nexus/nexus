import { GraphQLFieldResolver } from 'graphql'
import { AllInputTypes, FieldResolver, GetGen, GetGen3, HasGen3, NeedsResolver } from '../typegenTypeHelpers'
import { ArgsRecord } from './args'
import {
  AllNexusInputTypeDefs,
  AllNexusOutputTypeDefs,
  isNexusWrappingType,
  NexusWrapKind,
  wrapAsNexusType,
} from './wrapping'
import { BaseScalars } from './_types'

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
  subscribe?: GraphQLFieldResolver<any, any>
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
  addDynamicOutputMembers(block: OutputDefinitionBlock<any>, wrapping: NexusWrapKind[]): void
  warn(msg: string): void
}

export interface InputDefinitionBuilder {
  typeName: string
  addField(config: NexusInputFieldDef): void
  addDynamicInputFields(block: InputDefinitionBlock<any>, wrapping: NexusWrapKind[]): void
  warn(msg: string): void
}

// prettier-ignore
export interface OutputDefinitionBlock<TypeName extends string>
       extends NexusGenCustomOutputMethods<TypeName>,
               NexusGenCustomOutputProperties<TypeName>
       {}

/**
 * The output definition block is passed to the "definition"
 * argument of the
 */
export class OutputDefinitionBlock<TypeName extends string> {
  readonly typeName: string
  constructor(
    protected typeBuilder: OutputDefinitionBuilder,
    protected nonNullDefault: boolean,
    protected wrapping: NexusWrapKind[] = ['WrappedDef']
  ) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicOutputMembers(this, this.wrapping)
  }

  get list() {
    const [wrappedType, ...rest] = this.wrapping
    return new OutputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'List',
      ...rest,
    ])
  }

  get nonNull(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    const [wrappedType, ...rest] = this.wrapping
    return new OutputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'NonNull',
      ...rest,
    ])
  }

  get nullable(): Omit<OutputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    const [wrappedType, ...rest] = this.wrapping
    return new OutputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'Null',
      ...rest,
    ])
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
    // FIXME
    // 1. FieldOutConfig<TypeName is constrained to any string subtype
    // 2. NexusOutputFieldDef is constrained to be be a string
    // 3. so `name` is not compatible
    // 4. and changing FieldOutConfig to FieldOutConfig<string breaks types in other places
    this.typeBuilder.addField(this.decorateField({ name, ...fieldConfig } as any))
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: [] | ScalarOutSpread<TypeName, any>
  ) {
    let config: NexusOutputFieldDef = {
      name: fieldName,
      type: typeName,
    }

    if (typeof opts[0] === 'function') {
      config.resolve = opts[0] as any
      console.warn(
        `Since v0.18.0 Nexus no longer supports resolver shorthands like:\n\n    t.string("${fieldName}", () => ...).\n\nInstead please write:\n\n    t.string("${fieldName}", { resolve: () => ... })\n\nIn the next version of Nexus this will be a runtime error.`
      )
    } else {
      config = { ...config, ...opts[0] }
    }

    this.typeBuilder.addField(this.decorateField(config))
  }

  protected decorateField(config: NexusOutputFieldDef): NexusOutputFieldDef {
    if (isNexusWrappingType(config.type)) {
      if (this.wrapping.length > 1) {
        throw new Error(
          'Cannot use t.list|nonNull|nullable shorthands and list()|nonNull()|null() at the same time'
        )
      }
    } else {
      config.type = wrapAsNexusType(config.type, this.wrapping, this.nonNullDefault)
    }

    return config
  }
}

export interface ScalarInputFieldConfig<T> extends CommonFieldConfig {
  /**
   * The default value for the field, if any
   */
  default?: T
}

export interface NexusInputFieldConfig<TypeName extends string, FieldName extends string>
  extends ScalarInputFieldConfig<GetGen3<'inputTypes', TypeName, FieldName>> {
  type: AllInputTypes | AllNexusInputTypeDefs<string>
}

export type NexusInputFieldDef = NexusInputFieldConfig<string, string> & {
  name: string
}

export interface InputDefinitionBlock<TypeName extends string> extends NexusGenCustomInputMethods<TypeName> {}

export class InputDefinitionBlock<TypeName extends string> {
  readonly typeName: string
  constructor(
    protected typeBuilder: InputDefinitionBuilder,
    protected nonNullDefault: boolean,
    protected wrapping: NexusWrapKind[] = ['WrappedDef']
  ) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicInputFields(this, this.wrapping)
  }

  get list(): InputDefinitionBlock<TypeName> {
    const [wrappedType, ...rest] = this.wrapping
    return new InputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'List',
      ...rest,
    ])
  }

  get nonNull(): Omit<InputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    const [wrappedType, ...rest] = this.wrapping
    return new InputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'NonNull',
      ...rest,
    ])
  }

  get nullable(): Omit<InputDefinitionBlock<TypeName>, 'nonNull' | 'nullable'> {
    const [wrappedType, ...rest] = this.wrapping
    return new InputDefinitionBlock<TypeName>(this.typeBuilder, this.nonNullDefault, [
      wrappedType,
      'Null',
      ...rest,
    ])
  }

  string(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, 'String', opts)
  }

  int(fieldName: string, opts?: ScalarInputFieldConfig<number>) {
    this.addScalarField(fieldName, 'Int', opts)
  }

  boolean(fieldName: string, opts?: ScalarInputFieldConfig<boolean>) {
    this.addScalarField(fieldName, 'Boolean', opts)
  }

  id(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, 'ID', opts)
  }

  float(fieldName: string, opts?: ScalarInputFieldConfig<number>) {
    this.addScalarField(fieldName, 'Float', opts)
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldConfig: NexusInputFieldConfig<TypeName, FieldName>
  ) {
    this.typeBuilder.addField(
      this.decorateField({
        name: fieldName,
        ...fieldConfig,
      })
    )
  }

  protected addScalarField(fieldName: string, typeName: BaseScalars, opts: ScalarInputFieldConfig<any> = {}) {
    this.typeBuilder.addField(
      this.decorateField({
        name: fieldName,
        type: typeName,
        ...opts,
      })
    )
  }

  protected decorateField(config: NexusInputFieldDef): NexusInputFieldDef {
    if (isNexusWrappingType(config.type)) {
      if (this.wrapping.length > 1) {
        throw new Error(
          'Cannot use t.list|nonNull|nullable shorthands and list()|nonNull()|null() at the same time'
        )
      }
    } else {
      config.type = wrapAsNexusType(config.type, this.wrapping, this.nonNullDefault)
    }

    return config
  }
}
