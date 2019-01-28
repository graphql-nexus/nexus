import { DeprecationInfo, NexusTypes, BaseScalars } from "./_types";
import { ArgDef } from "./args";
import {
  AbstractTypeResolver,
  NeedsResolver,
  NexusFieldResolver,
  GetGen,
} from "../typegenTypeHelpers";
import { WrappedOutput } from "./wrappedType";
import { GraphQLCompositeType, GraphQLLeafType } from "graphql";

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

export interface OutputScalarConfig extends CommonFieldConfig {
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

export interface OutputFieldConfig<GenTypes = NexusGen>
  extends OutputScalarConfig {
  type:
    | GetGen<GenTypes, "allOutputTypes">
    | WrappedOutput
    | GraphQLCompositeType
    | GraphQLLeafType;
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

export type ScalarOutSpread<
  TypeName extends string,
  FieldName extends string,
  Fallback = any,
  GenTypes = NexusGen
> = NeedsResolver<TypeName, FieldName, GenTypes> extends true
  ?
      | [NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>]
      | [ScalarOutConfig<TypeName, FieldName, Fallback, GenTypes>]
  :
      | []
      | [NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>]
      | [ScalarOutConfig<TypeName, FieldName, Fallback, GenTypes>];

export type ScalarOutConfig<
  TypeName extends string,
  FieldName extends string,
  Fallback = any,
  GenTypes = NexusGen
> = NeedsResolver<TypeName, FieldName, GenTypes> extends true
  ? OutputScalarConfig & {
      resolve: NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>;
    }
  : OutputScalarConfig & {
      resolve?: NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>;
    };

export type FieldOutConfig<
  TypeName extends string,
  FieldName extends string,
  Fallback = any,
  GenTypes = NexusGen
> = OutputFieldConfig &
  (NeedsResolver<TypeName, FieldName, GenTypes> extends true
    ? {
        resolve: NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>;
      }
    : {
        resolve?: NexusFieldResolver<TypeName, FieldName, Fallback, GenTypes>;
      });

export type ScalarInSpread<
  TypeName extends string,
  FieldName extends string,
  Fallback,
  GenTypes = NexusGen
> = [] | [];

export type FieldInArgs = [] | [];

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
    return new OutputDefinitionBlock(this.typeBuilder, true);
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, string, GenTypes>
  ) {
    this.addScalarField(fieldName, "String", opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, number, GenTypes>
  ) {
    this.addScalarField(fieldName, "Int", opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, boolean, GenTypes>
  ) {
    this.addScalarField(fieldName, "Boolean", opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, string, GenTypes>
  ) {
    this.addScalarField(fieldName, "ID", opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName, number, GenTypes>
  ) {
    this.addScalarField(fieldName, "Float", opts);
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldDef: FieldOutConfig<TypeName, FieldName, any, GenTypes>
  ) {
    this.typeBuilder.addField();
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: ScalarOutSpread<TypeName, any, any, GenTypes>
  ) {
    if (typeof opts[0] === "function") {
    }
    this.typeBuilder.addField({
      name: fieldName,
      type: typeName,
    });
  }
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
    return new InputDefinitionBlock(this.typeBuilder, true);
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInSpread<TypeName, FieldName, string>
  ) {
    this.addScalarField(fieldName, opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInSpread<TypeName, FieldName, number>
  ) {
    this.addScalarField(fieldName, opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInSpread<TypeName, FieldName, boolean>
  ) {
    this.addScalarField(fieldName, opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInSpread<TypeName, FieldName, string>
  ) {
    this.addScalarField(fieldName, opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarInSpread<TypeName, FieldName, string>
  ) {
    this.addScalarField(fieldName, opts);
  }

  field<FieldName extends string>(
    fieldName: FieldName,
    fieldConfig: ScalarInSpread<TypeName, FieldName, string>
  ) {
    this.typeBuilder.addField({
      name: fieldName,
      ...fieldConfig,
    });
  }
  protected addScalarField(
    fieldName: string,
    opts: ScalarInSpread<TypeName, any, any>
  ) {}
}

export interface AbstractOutputDefinitionBuilder
  extends OutputDefinitionBuilder {
  setResolveType(fn: AbstractTypeResolver<any>): void;
}

export class AbstractOutputDefinitionBlock<
  TypeName extends string,
  GenTypes = NexusGen
> extends OutputDefinitionBlock<TypeName, NexusGen> {
  constructor(protected typeBuilder: AbstractOutputDefinitionBuilder) {
    super(typeBuilder);
  }
  /**
   *
   */
  resolveType(fn: AbstractTypeResolver<TypeName, GenTypes>) {
    this.typeBuilder.setResolveType(fn);
  }
}
