import { DeprecationInfo, NexusTypes } from "./_types";
import { ArgDef } from "./args";

export interface CommonFieldConfig {
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string | DeprecationInfo;
  /**
   * Whether the field is list of values, or just a single value.
   *
   * If list is true, we assume the field is a list. If list is an array,
   * we'll assume that it's a list with the depth. The boolean indicates whether
   * the field is required (non-null).
   *
   * @see TODO: Examples
   */
  list?: true | boolean[];
}

export interface OutputFieldConfig extends CommonFieldConfig {
  /**
   * Whether the field can be null
   * @default (false - depends on whether nullability is configured)
   */
  nullable?: boolean;
  /**
   * Arguments for the field
   */
  args?: Record<string, ArgDef>;
}

export interface InputFieldConfig extends CommonFieldConfig {
  /**
   * Whether the field is required (non-nullable)
   * @default
   */
  required?: boolean;
}

export interface OutputFieldDef extends OutputFieldConfig {
  nexus: NexusTypes.OutputField;
  name: string;
  type: any;
}

export interface InputFieldDef extends InputFieldConfig {
  nexus: NexusTypes.InputField;
  name: string;
  type: any;
}

export type ScalarOutArgs<
  TypeName extends string,
  FieldName extends string,
  Fallback,
  GenTypes = NexusGen
> = [] | [];

export type FieldOutArgs<
  TypeName extends string,
  FieldName extends string,
  Fallback,
  GenTypes = NexusGen
> = [] | [];

export type ScalarInArgs<
  TypeName extends string,
  FieldName extends string,
  Fallback,
  GenTypes = NexusGen
> = [] | [];

export type FieldInArgs = [] | [];

/**
 * The output definition block is passed to the "definition"
 * argument of the
 */
export class OutputDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {
  protected hasAdded: boolean;

  constructor(protected fields: any[], isList = false) {
    this.hasAdded = false;
  }

  get list() {
    return new OutputDefinitionBlock(this.fields, true);
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutArgs<TypeName, FieldName, string, GenTypes>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutArgs<TypeName, FieldName, number, GenTypes>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutArgs<TypeName, FieldName, boolean, GenTypes>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutArgs<TypeName, FieldName, string, GenTypes>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutArgs<TypeName, FieldName, number, GenTypes>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    ...opts: FieldOutArgs<TypeName, FieldName, GenTypes>
  ) {}

  protected addScalarField(
    fieldName: string,
    ...opts: ScalarOutArgs<TypeName, any, any, GenTypes>
  ) {
    this.fields.push();
  }
}

export class InputDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {
  protected hasAdded: boolean;

  constructor(protected fields: any[], isList = false) {
    this.hasAdded = false;
  }

  get list() {
    return new InputDefinitionBlock(this.fields, true);
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, string>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, number>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, boolean>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, string>
  ) {
    this.addScalarField(fieldName, ...opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, string>
  ) {}

  field<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInArgs<TypeName, FieldName, string>
  ) {}

  protected addScalarField(
    fieldName: string,
    ...opts: ScalarInArgs<TypeName, any, any>
  ) {}
}
