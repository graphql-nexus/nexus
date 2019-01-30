import { NexusTypes, BaseScalars } from "./_types";
import {
  AbstractTypeResolver,
  NeedsResolver,
  FieldResolver,
  GetGen,
  HasGen3,
} from "../typegenTypeHelpers";
import { NexusInputTypeName, AllNexusOutputTypeDefs } from "./wrapping";
import { NexusArgDef } from "./args";

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
  args?: Record<string, NexusArgDef<string>>;
  /**
   * Resolve method for the field
   */
  resolve?: FieldResolver<TypeName, FieldName, GenTypes>;
}

export interface NexusOutputFieldConfig<
  TypeName extends string,
  FieldName extends string,
  GenTypes = NexusGen
> extends OutputScalarConfig<TypeName, FieldName, GenTypes> {
  type: GetGen<GenTypes, "allOutputTypes"> | AllNexusOutputTypeDefs;
}

export type NexusOutputFieldDef = NexusOutputFieldConfig<
  string,
  string,
  any
> & {
  name: string;
};

/**
 * Ensure type-safety by checking
 */
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
  ? NexusOutputFieldConfig<TypeName, FieldName, GenTypes> & {
      resolve: FieldResolver<TypeName, FieldName, GenTypes>;
    }
  : NexusOutputFieldConfig<TypeName, FieldName, GenTypes>;

export interface OutputDefinitionBuilder {
  addField(config: NexusOutputFieldDef): void;
}

export interface InputDefinitionBuilder {
  addField(config: NexusInputFieldDef): void;
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
    const field: NexusOutputFieldDef = {
      name,
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
    let config: NexusOutputFieldDef = {
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

export interface NexusInputFieldConfig<GenTypes = NexusGen>
  extends ScalarInputFieldConfig<string> {
  type: GetGen<GenTypes, "allInputTypes"> | NexusInputTypeName<string>;
}

export type NexusInputFieldDef = NexusInputFieldConfig & {
  name: string;
};

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
    this.addScalarField(fieldName, "String", opts);
  }

  int(fieldName: string, opts?: ScalarInputFieldConfig<number>) {
    this.addScalarField(fieldName, "Int", opts);
  }

  boolean(fieldName: string, opts?: ScalarInputFieldConfig<boolean>) {
    this.addScalarField(fieldName, "Boolean", opts);
  }

  id(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, "ID", opts);
  }

  float(fieldName: string, opts?: ScalarInputFieldConfig<string>) {
    this.addScalarField(fieldName, "Float", opts);
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldConfig: NexusInputFieldConfig<GenTypes>
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      ...fieldConfig,
    });
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: ScalarInputFieldConfig<any> = {}
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      type: typeName,
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
