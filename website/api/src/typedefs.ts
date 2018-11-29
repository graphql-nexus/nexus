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

export interface TypeWithArgsRecord extends RecordOf<TypeWithArgsProps> {}

export interface TagProps {
  name: string;
  comment: string;
}

export interface TagRecord extends RecordOf<TagProps> {}

export interface DocProps {
  comment: string;
  tags: List<RecordOf<TagProps>>;
}

export interface DocRecord extends RecordOf<DocProps> {}

export interface ParamProps {
  name: string;
  type: TypeVal;
  optional: boolean;
  doc: Maybe<DocRecord>;
}

export interface ParamRecord extends RecordOf<ParamProps> {}

export interface FuncProps {
  node: "Func";
  name: string | null;
  params: List<RecordOf<ParamProps>>;
  doc: Maybe<RecordOf<DocProps>>;
  type: null | TypeVal;
}

export interface FuncRecord extends RecordOf<FuncProps> {}

export interface ClassMethodProps {
  name: string;
  params: List<ParamRecord>;
  type: null | TypeVal;
  doc: Maybe<DocRecord>;
}

export interface ClassMethodRecord extends RecordOf<ClassMethodProps> {}

export interface ClassProps {
  node: "Class";
  name: string | null;
  members: List<ClassMethodRecord>;
  doc: Maybe<DocRecord>;
}

export interface ClassRecord extends RecordOf<ClassProps> {}

export interface InterfaceProps {
  node: "Interface";
  name: string;
  doc: Maybe<DocRecord>;
  members: List<PropertyRecord>;
  inherits: List<string>;
}

export interface InterfaceRecord extends RecordOf<InterfaceProps> {}

export interface PropertyProps {
  name: string;
  type: TypeVal | null;
  doc: Maybe<DocRecord>;
}

export interface PropertyRecord extends RecordOf<PropertyProps> {}

export const TypeWithArgsRecord = Record<TypeWithArgsProps>(
  {
    name: "",
    args: List(),
  },
  "TypeWithArgsRecord"
);

export const TagRecord = Record<TagProps>(
  {
    name: "",
    comment: "",
  },
  "TagRecord"
);

export const DocRecord = Record<DocProps>(
  {
    comment: "",
    tags: List(),
  },
  "DocRecord"
);

export const ParamRecord = Record<ParamProps>(
  {
    name: "",
    type: "",
    optional: false,
    doc: null,
  },
  "ParamRecord"
);

export const FuncRecord = Record<FuncProps>(
  {
    node: "Func",
    name: "",
    params: List(),
    doc: null,
    type: null,
  },
  "FuncRecord"
);

export const ClassRecord = Record<ClassProps>(
  {
    node: "Class",
    name: "",
    members: List(),
    doc: null,
  },
  "ClassRecord"
);

export const ClassMethodRecord = Record<ClassMethodProps>(
  {
    name: "",
    params: List(),
    type: null,
    doc: null,
  },
  "ClassMethodRecord"
);

export const InterfaceRecord = Record<InterfaceProps>(
  {
    node: "Interface",
    name: "",
    doc: null,
    members: List(),
    inherits: List(),
  },
  "InterfaceRecord"
);

export const PropertyRecord = Record<PropertyProps>(
  {
    name: "",
    type: null,
    doc: null,
  },
  "PropertyRecord"
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
  TagRecord,
  ClassMethodRecord,
  ParamRecord,
  ClassRecord,
  FuncRecord,
  DocRecord,
  InterfaceRecord,
  PropertyRecord,
  TypeWithArgsRecord,
  ParsedFiles,
]);
