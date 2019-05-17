import {
  AbstractTypeResolver,
  FieldResolver,
  GetGen,
  HasGen3,
  NeedsResolver,
  AuthorizeResolver,
  GetGen3,
} from "../typegenTypeHelpers";
import { NexusArgDef } from "./args";
import {
  AllNexusOutputTypeDefs,
  NexusWrappedType,
  AllNexusInputTypeDefs,
} from "./wrapping";
import { BaseScalars } from "./_types";
import { GraphQLFieldResolver } from "graphql";

export const ADD_CUSTOM_FIELD = Symbol.for("@nexus/addCustomField");

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

export interface CommonOutputFieldConfig<
  TypeName extends string,
  FieldName extends string
> extends CommonFieldConfig {
  /**
   * Arguments for the field
   */
  args?: Record<string, NexusArgDef<string>>;
  /**
   * Authorization for an individual field. Returning "true"
   * or "Promise<true>" means the field can be accessed.
   * Returning "false" or "Promise<false>" will respond
   * with a "Not Authorized" error for the field. Returning
   * or throwing an error will also prevent the resolver from
   * executing.
   */
  authorize?: AuthorizeResolver<TypeName, FieldName>;
}

export interface OutputScalarConfig<
  TypeName extends string,
  FieldName extends string
> extends CommonOutputFieldConfig<TypeName, FieldName> {
  /**
   * Resolve method for the field
   */
  resolve?: FieldResolver<TypeName, FieldName>;
}

export interface NexusOutputFieldConfig<
  TypeName extends string,
  FieldName extends string
> extends OutputScalarConfig<TypeName, FieldName> {
  type:
    | GetGen<"allOutputTypes">
    | AllNexusOutputTypeDefs
    | NexusWrappedType<AllNexusOutputTypeDefs>;
}

export type NexusOutputFieldDef = NexusOutputFieldConfig<string, any> & {
  name: string;
  subscribe?: GraphQLFieldResolver<any, any>;
};

/**
 * Ensure type-safety by checking
 */
export type ScalarOutSpread<
  TypeName extends string,
  FieldName extends string
> = NeedsResolver<TypeName, FieldName> extends true
  ? HasGen3<"argTypes", TypeName, FieldName> extends true
    ? [ScalarOutConfig<TypeName, FieldName>]
    :
        | [ScalarOutConfig<TypeName, FieldName>]
        | [FieldResolver<TypeName, FieldName>]
  : HasGen3<"argTypes", TypeName, FieldName> extends true
  ? [ScalarOutConfig<TypeName, FieldName>]
  :
      | []
      | [FieldResolver<TypeName, FieldName>]
      | [ScalarOutConfig<TypeName, FieldName>];

export type ScalarOutConfig<
  TypeName extends string,
  FieldName extends string
> = NeedsResolver<TypeName, FieldName> extends true
  ? OutputScalarConfig<TypeName, FieldName> & {
      resolve: FieldResolver<TypeName, FieldName>;
    }
  : OutputScalarConfig<TypeName, FieldName>;

export type FieldOutConfig<
  TypeName extends string,
  FieldName extends string
> = NeedsResolver<TypeName, FieldName> extends true
  ? NexusOutputFieldConfig<TypeName, FieldName> & {
      resolve: FieldResolver<TypeName, FieldName>;
    }
  : NexusOutputFieldConfig<TypeName, FieldName>;

export interface OutputDefinitionBuilder {
  addField(config: NexusOutputFieldDef): void;
}

export interface InputDefinitionBuilder {
  addField(config: NexusInputFieldDef): void;
}

export interface OutputDefinitionBlock<TypeName extends string>
  extends NexusGenCustomDefinitionMethods<TypeName> {}

/**
 * The output definition block is passed to the "definition"
 * argument of the
 */
export class OutputDefinitionBlock<TypeName extends string> {
  protected hasAdded: boolean = false;
  protected extendedFieldMap: Record<string, string> = {};

  constructor(
    protected typeBuilder: OutputDefinitionBuilder,
    protected isList = false
  ) {}

  /**
   * Adds a custom field to the output definition block,
   * keeping track of the fields so they can be chained via the .list
   */
  [ADD_CUSTOM_FIELD](methodName: string, typeName: string) {
    this.extendedFieldMap[methodName] = typeName;
    // @ts-ignore
    this[methodName] = (fieldName: string, opts: any) => {
      this.field(fieldName, {
        type: typeName,
        ...opts,
      });
    };
  }

  get list() {
    if (this.isList) {
      throw new Error(
        "Cannot chain list.list, in the definition block. Use `list: []` config value"
      );
    }
    return copyFields(
      this.extendedFieldMap,
      new OutputDefinitionBlock<TypeName>(this.typeBuilder, true)
    );
  }

  string<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, "String", opts);
  }

  int<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, "Int", opts);
  }

  boolean<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, "Boolean", opts);
  }

  id<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, "ID", opts);
  }

  float<FieldName extends string>(
    fieldName: FieldName,
    ...opts: ScalarOutSpread<TypeName, FieldName>
  ) {
    this.addScalarField(fieldName, "Float", opts);
  }

  field<FieldName extends string>(
    name: FieldName,
    fieldConfig: FieldOutConfig<TypeName, FieldName>
  ) {
    const field: NexusOutputFieldDef = {
      name,
      ...fieldConfig,
    };
    this.typeBuilder.addField(this.decorateField(field));
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: [] | ScalarOutSpread<TypeName, any>
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
    this.typeBuilder.addField(this.decorateField(config));
  }

  protected decorateField(config: NexusOutputFieldDef): NexusOutputFieldDef {
    if (this.isList) {
      if (config.list) {
        console.warn(
          `It looks like you chained .list and set list for ${config.name}` +
            "You should only do one or the other"
        );
      } else {
        config.list = true;
      }
    }
    return config;
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

export interface NexusInputFieldConfig<
  TypeName extends string,
  FieldName extends string
> extends ScalarInputFieldConfig<GetGen3<"inputTypes", TypeName, FieldName>> {
  type: GetGen<"allInputTypes"> | AllNexusInputTypeDefs<string>;
}

export type NexusInputFieldDef = NexusInputFieldConfig<string, string> & {
  name: string;
};

export interface InputDefinitionBlock<TypeName extends string>
  extends NexusGenCustomDefinitionMethods<TypeName> {}

export class InputDefinitionBlock<TypeName extends string> {
  protected hasAdded: boolean = false;
  protected extendedFieldMap: Record<string, string> = {};

  constructor(
    protected typeBuilder: InputDefinitionBuilder,
    protected isList = false
  ) {}

  /**
   * Adds a custom field to the output definition block,
   * keeping track of the fields so they can be chained via the .list
   */
  [ADD_CUSTOM_FIELD](methodName: string, typeName: string) {
    this.extendedFieldMap[methodName] = typeName;
    // @ts-ignore
    this[methodName] = (fieldName: string, opts: any) => {
      this.field(fieldName, {
        type: typeName,
        ...opts,
      });
    };
  }

  get list() {
    if (this.isList) {
      throw new Error(
        "Cannot chain list.list, in the definition block. Use `list: []` config value"
      );
    }
    return copyFields(
      this.extendedFieldMap,
      new InputDefinitionBlock<TypeName>(this.typeBuilder, true)
    );
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

  float(fieldName: string, opts?: ScalarInputFieldConfig<number>) {
    this.addScalarField(fieldName, "Float", opts);
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
    );
  }

  protected addScalarField(
    fieldName: string,
    typeName: BaseScalars,
    opts: ScalarInputFieldConfig<any> = {}
  ) {
    this.typeBuilder.addField(
      this.decorateField({
        name: fieldName,
        type: typeName,
        ...opts,
      })
    );
  }

  protected decorateField(config: NexusOutputFieldDef): NexusOutputFieldDef {
    if (this.isList) {
      if (config.list) {
        console.warn(
          `It looks like you chained .list and set list for ${config.name}` +
            "You should only do one or the other"
        );
      } else {
        config.list = true;
      }
    }
    return config;
  }
}

export interface AbstractOutputDefinitionBuilder<TypeName extends string>
  extends OutputDefinitionBuilder {
  setResolveType(fn: AbstractTypeResolver<TypeName>): void;
}

export const copyFields = <S extends { [ADD_CUSTOM_FIELD]: any }>(
  sourceMap: Record<string, string>,
  target: S
): S => {
  Object.keys(sourceMap).forEach((methodName) =>
    target[ADD_CUSTOM_FIELD](methodName, sourceMap[methodName])
  );
  return target;
};
