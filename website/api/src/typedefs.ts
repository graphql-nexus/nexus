/// <reference path="../src/modules.d.ts" />
import { OrderedMap, List, RecordOf, Record } from "immutable";
import TransitImmutable from "transit-immutable-js";

export type Maybe<T> = T | null;

export type TypeValPrimitive = string | FuncRecord | TypeWithArgsRecord;

export type TypeVal = TypeValPrimitive | List<TypeValPrimitive>;

export type TypeWithArgsProps = {
  name: string;
  args: List<TypeVal>;
};

export type TypeWithArgsRecord = RecordOf<TypeWithArgsProps>;

export interface TagProps {
  name: string;
  comment: string;
}

export type TagRecord = RecordOf<TagProps>;

export interface DocProps {
  comment: string;
  tags: List<RecordOf<TagProps>>;
}

export type DocRecord = RecordOf<DocProps>;

export interface ParamProps {
  name: string;
  type: TypeVal;
  optional: boolean;
  doc: Maybe<DocRecord>;
}

export type ParamRecord = RecordOf<ParamProps>;

export interface FuncProps {
  node: "Func";
  name: string | null;
  params: List<RecordOf<ParamProps>>;
  doc: Maybe<RecordOf<DocProps>>;
  type: null | TypeVal;
}

export type FuncRecord = RecordOf<FuncProps>;

export interface ClassMethodProps {
  name: string;
  params: List<ParamRecord>;
  type: null | TypeVal;
  doc: Maybe<DocRecord>;
}

export type ClassMethodRecord = RecordOf<ClassMethodProps>;

export interface ClassProps {
  node: "Class";
  name: string | null;
  members: List<ClassMethodRecord>;
  doc: Maybe<DocRecord>;
}

export type ClassRecord = RecordOf<ClassProps>;

export interface InterfaceProps {
  node: "Interface";
  name: string;
  doc: Maybe<DocRecord>;
  members: List<PropertyRecord>;
  inherits: List<string>;
}

export type InterfaceRecord = RecordOf<InterfaceProps>;

export interface PropertyProps {
  name: string;
  type: TypeVal | null;
  doc: Maybe<DocRecord>;
}

export type PropertyRecord = RecordOf<PropertyProps>;

export const TypeWithArgsStruct = Record<TypeWithArgsProps>(
  {
    name: "",
    args: List(),
  },
  "TypeWithArgsStruct"
);

export const TagStruct = Record<TagProps>(
  {
    name: "",
    comment: "",
  },
  "TagStruct"
);

export const DocStruct = Record<DocProps>(
  {
    comment: "",
    tags: List(),
  },
  "DocStruct"
);

export const ParamStruct = Record<ParamProps>(
  {
    name: "",
    type: "",
    optional: false,
    doc: null,
  },
  "ParamStruct"
);

export const FuncStruct = Record<FuncProps>(
  {
    node: "Func",
    name: "",
    params: List(),
    doc: null,
    type: null,
  },
  "FuncStruct"
);

export const ClassStruct = Record<ClassProps>(
  {
    node: "Class",
    name: "",
    members: List(),
    doc: null,
  },
  "ClassStruct"
);

export const ClassMethodStruct = Record<ClassMethodProps>(
  {
    name: "",
    params: List(),
    type: null,
    doc: null,
  },
  "ClassMethodStruct"
);

export const InterfaceStruct = Record<InterfaceProps>(
  {
    node: "Interface",
    name: "",
    doc: null,
    members: List(),
    inherits: List(),
  },
  "InterfaceStruct"
);

export const PropertyStruct = Record<PropertyProps>(
  {
    name: "",
    type: null,
    doc: null,
  },
  "PropertyStruct"
);

export type BaseRecords = FuncRecord | ClassRecord | InterfaceRecord;

export const ParsedFiles = Record(
  {
    api: OrderedMap<string, BaseRecords>(),
    core: OrderedMap<string, BaseRecords>(),
    types: OrderedMap<string, BaseRecords>(),
  },
  "ParsedFiles"
);

export const isFuncRecord = (val: any): val is FuncRecord => {
  return val.node === "Func";
};

export const isClassRecord = (val: any): val is ClassRecord => {
  return val.node === "Class";
};

export const isInterfaceRecord = (val: any): val is InterfaceRecord => {
  return val.node === "Interface";
};

export const transit = TransitImmutable.withRecords([
  TagStruct,
  ClassMethodStruct,
  ParamStruct,
  ClassStruct,
  FuncStruct,
  DocStruct,
  InterfaceStruct,
  PropertyStruct,
  TypeWithArgsStruct,
  ParsedFiles,
]);
