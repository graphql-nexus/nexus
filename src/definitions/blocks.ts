import { NexusTypes, BaseScalars } from "./_types";
import { ArgDef } from "./args";
import {
  AbstractTypeResolver,
  NeedsResolver,
  FieldResolver,
  GetGen,
  HasGen3,
} from "../typegenTypeHelpers";
import { WrappedOutput, WrappedInput } from "./wrappedType";

export interface CommonFieldConfig {
  /**
   * Whether the field can be null
   * @default (depends on whether nullability is configured in type or schema)
   */
  nullable?: boolean;
  /**
   * The description to annotate the GraphQL SDL
   */
  description?: string | null;
  /**
   * Info about a field deprecation. Formatted as a string and provided with the
   * deprecated directive on field/enum types and as a comment on input fields.
   */
  deprecation?: string; // | DeprecationInfo;
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

export interface OutputScalarConfig<
  TypeName extends string,
  FieldName extends string,
  GenTypes
> extends CommonFieldConfig {
  /**
   * Arguments for the field
   */
  args?: Record<string, ArgDef>;
  /**
   * Resolve method for the field
   */
  resolve?: FieldResolver<TypeName, FieldName, GenTypes>;
}

export interface OutputFieldConfig<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> extends OutputScalarConfig<TypeName, FieldName, GenTypes> {
  type: GetGen<GenTypes, "allOutputTypes"> | WrappedOutput;
}

export interface OutputFieldDef extends OutputFieldConfig<any, any> {
  nexus: NexusTypes.OutputField;
  name: string;
  type: any;
}

export type ScalarOutSpread<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = NeedsResolver<TypeName, FieldName, GenTypes> extends true
  ? HasGen3<GenTypes, "argTypes", TypeName, FieldName> extends true
    ? [ScalarOutConfig<TypeName, FieldName, GenTypes>]
    :
        | [ScalarOutConfig<TypeName, FieldName, GenTypes>]
        | [FieldResolver<TypeName, FieldName, GenTypes>]
  : HasGen3<GenTypes, "argTypes", TypeName, FieldName> extends true
  ? [ScalarOutConfig<TypeName, FieldName, GenTypes>]
  :
      | []
      | [FieldResolver<TypeName, FieldName, GenTypes>]
      | [ScalarOutConfig<TypeName, FieldName, GenTypes>];

export type ScalarOutConfig<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = NeedsResolver<TypeName, FieldName, GenTypes> extends true
  ? OutputScalarConfig<TypeName, FieldName, GenTypes> & {
      resolve: FieldResolver<TypeName, FieldName, GenTypes>;
    }
  : OutputScalarConfig<TypeName, FieldName, GenTypes>;

export type FieldOutConfig<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> = NeedsResolver<TypeName, FieldName, GenTypes> extends true
  ? OutputFieldConfig<TypeName, FieldName, GenTypes> & {
      resolve: FieldResolver<TypeName, FieldName, GenTypes>;
    }
  : OutputFieldConfig<TypeName, FieldName, GenTypes>;

export interface OutputDefinitionBuilder {
  addField(config: OutputFieldDef): void;
}

export interface InputDefinitionBuilder {
  addField(config: InputFieldDef): void;
}

/**
 * The output definition block is passed to the "definition"
 * argument of the
 */
export class OutputDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {
  protected hasAdded: boolean;

  constructor(
    protected typeBuilder: OutputDefinitionBuilder,
    protected isList = false
  ) {
    this.hasAdded = false;
  }

  get list() {
    if (this.isList) {
      throw new Error(
        "Cannot chain list.list, in the definition block. Use `list: []` config value"
      );
    }
    return new OutputDefinitionBlock<TypeName, GenTypes>(
      this.typeBuilder,
      true
    );
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, GenTypes>
  ) {
    this.addScalarField(fieldName, "String", opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, GenTypes>
  ) {
    this.addScalarField(fieldName, "Int", opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, GenTypes>
  ) {
    this.addScalarField(fieldName, "Boolean", opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, GenTypes>
  ) {
    this.addScalarField(fieldName, "ID", opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, GenTypes>
  ) {
    this.addScalarField(fieldName, "Float", opts);
  }

  field<FieldName extends string>(
    name: FieldName,
    fieldConfig: FieldOutConfig<TypeName, FieldName, GenTypes>
  ) {
    const field: OutputFieldDef = {
      name,
      nexus: NexusTypes.OutputField,
      ...fieldConfig,
    };
    if (this.isList) {
      if (field.list) {
        console.warn(
          `It looks like you chained .list and set list for ${name}` +
            "You should only do one or the other"
        );
      } else {
        field.list = true;
      }
    }
    this.typeBuilder.addField(field);
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: [] | ScalarOutSpread<TypeName, any, GenTypes>
  ) {
    let config: OutputFieldDef = {
      nexus: NexusTypes.OutputField,
      name: fieldName,
      type: typeName,
    };
    if (typeof opts[0] === "function") {
      config.resolve = opts[0];
    } else {
      config = { ...config, ...opts[0] };
    }
    this.typeBuilder.addField(config);
  }
}

export interface ScalarInputFieldConfig<T> extends CommonFieldConfig {
  /**
   * Whether the field is required (non-nullable)
   * @default
   */
  required?: boolean;
  /**
   * The default value for the field, if any
   */
  default?: T;
}

export interface InputFieldConfig<GenTypes = NexusGen>
  extends ScalarInputFieldConfig<any> {
  type: GetGen<GenTypes, "allInputTypes"> | WrappedInput;
}

export interface InputFieldDef extends InputFieldConfig {
  nexus: NexusTypes.InputField;
  name: string;
  type: any;
}

export class InputDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> {
  protected hasAdded: boolean;

  constructor(protected typeBuilder: InputDefinitionBuilder, isList = false) {
    this.hasAdded = false;
  }

  get list() {
    return new InputDefinitionBlock<TypeName, GenTypes>(this.typeBuilder, true);
  }

  string(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, opts);
  }

  int(fieldName: string, opts?: ScalarInputFieldConfig<number>) {
    this.addScalarField(fieldName, opts);
  }

  boolean(fieldName: string, opts?: ScalarInputFieldConfig<boolean>) {
    this.addScalarField(fieldName, opts);
  }

  id(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, opts);
  }

  float(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, opts);
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldConfig: InputFieldConfig<GenTypes>
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      ...fieldConfig,
    });
  }

  protected addScalarField(fieldName: string, opts: any) {
    this.typeBuilder.addField({
      name: fieldName,
      nexus: NexusTypes.InputField,
      ...opts,
    });
  }
}

export interface AbstractOutputDefinitionBuilder<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBuilder {
  setResolveType(fn: AbstractTypeResolver<TypeName, GenTypes>): void;
}
