/**
 * Helpers for handling the generated schema
 */

export interface GenTypeEnumShape {
  members: string;
}

export interface GenTypeObjectTypeShape {
  members: string;
}

export interface GenTypeInputObjectShape {
  members: string;
}

export type GenObjectShape = {
  args: Record<string, any>;
  root: any;
};

export type GenInputObjectShape = {
  args: Record<string, any>;
  root: any;
};

export type GenTypesShape = {
  scalarTypes: Record<string, string>;
  enumTypes: Record<string, string>;
  objectTypes: Record<string, GenObjectShape>;
  inputObjectTypes: Record<string, GenInputObjectShape>;
  interfaceTypes: Record<string, GenObjectShape>;
  contextType: any;
};

export type OutputNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypesShape["enumTypes"], string>
  : string;

export type FieldNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypesShape["enumTypes"], string>
  : string;

export type InterfaceName<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypesShape["interfaceTypes"], string>
  : string;

export type EnumName<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypes["enumTypes"], string>
  : string;

export type EnumMembers<
  GenTypes,
  EnumName extends string
> = GenTypes extends GenTypesShape
  ? EnumName extends keyof GenTypes["enumTypes"]
    ? GenTypes["enumTypes"][EnumName]
    : never
  : string;

export type ObjectTypeDef<GenTypes, TypeName> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["objectTypes"]
    ? GenTypes["objectTypes"][TypeName]
    : never
  : string;

export type InputObjectTypeDef<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["inputObjectTypes"]
    ? GenTypes["inputObjectTypes"][TypeName]
    : never
  : string;

export type RootType<GenTypes, TypeName> = any;
