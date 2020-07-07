import { GraphQLFieldResolver } from 'graphql'
import {
  AbstractTypeResolver,
  AllInputTypes,
  FieldResolver,
  GetGen,
  GetGen3,
  HasGen3,
  NeedsResolver,
} from '../typegenTypeHelpers'
import { ArgsRecord } from './args'
import { AllNexusInputTypeDefs, AllNexusOutputTypeDefs } from './wrapping'
import { BaseScalars } from './_types'

export interface CommonFieldConfig {
  /**
   * Whether the field can be null
   * @default (depends on whether nullability is configured in type or schema)
   */
  nullable?: boolean
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string // | DeprecationInfo;
  /**
   * Whether the field is list of values, or just a single value.
   *
   * If list is true, we assume the field is a list. If list is an array,
   * we'll assume that it's a list with the depth. The boolean indicates whether
   * the field is required (non-null).
   *
   * @see TODO: Examples
   */
  list?: true | boolean[]
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

/**
 * Ensure type-safety by checking
 */
export type ScalarOutSpread<TypeName extends string, FieldName extends string> = NeedsResolver<
  TypeName,
  FieldName
> extends true
  ? HasGen3<'argTypes', TypeName, FieldName> extends true
    ? [ScalarOutConfig<TypeName, FieldName>]
    : [ScalarOutConfig<TypeName, FieldName>] | [FieldResolver<TypeName, FieldName>]
  : HasGen3<'argTypes', TypeName, FieldName> extends true
  ? [ScalarOutConfig<TypeName, FieldName>]
  : [] | [FieldResolver<TypeName, FieldName>] | [ScalarOutConfig<TypeName, FieldName>]

export type ScalarOutConfig<TypeName extends string, FieldName extends string> = NeedsResolver<
  TypeName,
  FieldName
> extends true
  ? OutputScalarConfig<TypeName, FieldName> & {
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
  addDynamicOutputMembers(block: OutputDefinitionBlock<any>, isList: boolean): void
  warn(msg: string): void
}

export interface InputDefinitionBuilder {
  typeName: string
  addField(config: NexusInputFieldDef): void
  addDynamicInputFields(block: InputDefinitionBlock<any>, isList: boolean): void
  warn(msg: string): void
}

export interface OutputDefinitionBlock<TypeName extends string>
  extends NexusGenCustomOutputMethods<TypeName>,
    NexusGenCustomOutputProperties<TypeName> {}

/**
 * The output definition block is passed to the "definition"
 * argument of the
 */
export class OutputDefinitionBlock<TypeName extends string> {
  readonly typeName: string
  constructor(protected typeBuilder: OutputDefinitionBuilder, protected isList = false) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicOutputMembers(this, isList)
  }

  get list() {
    if (this.isList) {
      throw new Error('Cannot chain list.list, in the definition block. Use `list: []` config value')
    }
    return new OutputDefinitionBlock<TypeName>(this.typeBuilder, true)
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
    // 2. NexusOutputFieldDef is contrained to be be a string
    // 3. so `name` is not compatible
    // 4. and changing FieldOutConfig to FieldOutConfig<string breaks types in other places
    const field: any = { name, ...fieldConfig }
    this.typeBuilder.addField(this.decorateField(field))
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
      // FIXME ditto to the one in `field` method
      config.resolve = opts[0] as any
    } else {
      config = { ...config, ...opts[0] }
    }
    this.typeBuilder.addField(this.decorateField(config))
  }

  protected decorateField(config: NexusOutputFieldDef): NexusOutputFieldDef {
    if (this.isList) {
      if (config.list) {
        this.typeBuilder.warn(
          `It looks like you chained .list and set list for ${config.name}. ` +
            'You should only do one or the other'
        )
      } else {
        config.list = true
      }
    }
    return config
  }
}

export interface ScalarInputFieldConfig<T> extends CommonFieldConfig {
  /**
   * Whether the field is required (non-nullable)
   * @default
   */
  required?: boolean
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
  constructor(protected typeBuilder: InputDefinitionBuilder, protected isList = false) {
    this.typeName = typeBuilder.typeName
    this.typeBuilder.addDynamicInputFields(this, isList)
  }

  get list() {
    if (this.isList) {
      throw new Error('Cannot chain list.list, in the definition block. Use `list: []` config value')
    }
    return new InputDefinitionBlock<TypeName>(this.typeBuilder, true)
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
    if (this.isList) {
      if (config.list) {
        this.typeBuilder.warn(
          `It looks like you chained .list and set list for ${config.name}. ` +
            'You should only do one or the other'
        )
      } else {
        config.list = true
      }
    }
    return config
  }
}

export interface AbstractOutputDefinitionBuilder<TypeName extends string> extends OutputDefinitionBuilder {
  setResolveType(fn: AbstractTypeResolver<TypeName>): void
}
