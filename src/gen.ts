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
  enums: Record<string, any>;
  objects: Record<string, any>;
  inputObjects: Record<string, any>;
  unions: Record<string, any>;
  scalars: Record<string, any>;
  interfaces: Record<string, any>;
  availableInputTypes: string;
  availableOutputTypes: string;
};

export type OutputNames<GenTypes> = GenTypes extends GenTypesShape
  ? Extract<keyof GenTypesShape["objects"], string>
  : string;

export type InterfaceName<GenTypes> = GenTypes extends { interfaces: infer U }
  ? Extract<keyof U, string>
  : string;

export type EnumName<GenTypes> = GenTypes extends { enums: infer U }
  ? Extract<keyof U, string>
  : string;

export type EnumMembers<
  GenTypes,
  EnumName extends string
> = GenTypes extends GenTypesShape
  ? EnumName extends keyof GenTypes["enums"]
    ? GenTypes["enums"][EnumName]
    : never
  : string;

export type ObjectTypeDef<GenTypes, TypeName> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["objects"]
    ? GenTypes["objects"][TypeName]
    : never
  : string;

export type InputObjectTypeDef<
  GenTypes,
  TypeName
> = GenTypes extends GenTypesShape
  ? TypeName extends keyof GenTypes["inputObjects"]
    ? GenTypes["inputObjects"][TypeName]
    : never
  : string;

export type RootType<GenTypes, TypeName> = any;

export type AllInputTypes<
  GenTypes,
  K = "availableInputTypes"
> = K extends keyof GenTypes ? GenTypes[K] : never;

export type AllOutputTypes<
  GenTypes,
  K = "availableOutputTypes"
> = K extends keyof GenTypes ? GenTypes[K] : never;
