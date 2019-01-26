import {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInputType as GraphQLType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isSpecifiedScalarType,
  isUnionType,
  GraphQLNamedType,
  specifiedScalarTypes,
} from "graphql";
import { eachObj, mapObj } from "./utils";
import { Metadata } from "./metadata";
import * as Types from "./types";

const SpecifiedScalars = {
  ID: "string",
  String: "string",
  Float: "number",
  Int: "number",
  Boolean: "boolean",
};

interface GroupedTypes {
  input: GraphQLInputObjectType[];
  interface: GraphQLInterfaceType[];
  interfaceMembers: Record<string, string[]>;
  object: GraphQLObjectType[];
  union: GraphQLUnionType[];
  enum: GraphQLEnumType[];
  scalar: GraphQLScalarType[];
}

type TypeFieldMapping = Record<string, Record<string, [string, string]>>;
type TypeMapping = Record<string, string>;
type RootTypeMapping = Record<
  string,
  string | Record<string, [string, string]>
>;

/**
 * We track and output a few main things:
 *
 * 1. "root" types, or the values that fill the first
 *    argument for a given object type
 *
 * 2. "arg" types, the values that are arguments to output fields.
 *
 * 3. "return" types, the values returned from the resolvers... usually
 *    just list/nullable variations on the "root" types for other types
 *
 * 4. The names of all types, grouped by type.
 *
 * - Non-scalar types will get a dedicated "Root" type associated with it
 */
export class Typegen {
  groupedTypes: GroupedTypes = {
    input: [],
    interface: [],
    interfaceMembers: {},
    object: [],
    union: [],
    enum: [],
    scalar: ([] as GraphQLScalarType[]).concat(specifiedScalarTypes),
  };

  constructor(
    protected schema: GraphQLSchema,
    protected metadata: Metadata,
    protected typegenInfo: Types.TypegenInfo
  ) {
    const schemaTypeMap = schema.getTypeMap();
    Object.keys(schemaTypeMap).forEach((typeName) => {
      if (typeName.indexOf("__") === 0) {
        return;
      }
      const type = schema.getType(typeName);
      if (isObjectType(type)) {
        this.groupedTypes.object.push(type);
        type.getInterfaces().forEach((i) => {
          this.groupedTypes.interfaceMembers[i.name] =
            this.groupedTypes.interfaceMembers[i.name] || [];
          this.groupedTypes.interfaceMembers[i.name].push(type.name);
        });
      } else if (isInputObjectType(type)) {
        this.groupedTypes.input.push(type);
      } else if (isScalarType(type) && !isSpecifiedScalarType(type)) {
        this.groupedTypes.scalar.push(type);
      } else if (isUnionType(type)) {
        this.groupedTypes.union.push(type);
      } else if (isInterfaceType(type)) {
        this.groupedTypes.interface.push(type);
      } else if (isEnumType(type)) {
        this.groupedTypes.enum.push(type);
      }
    });
  }

  print() {
    return [
      this.printHeaders(),
      this.printInputTypeMap(),
      this.printEnumTypeMap(),
      this.printRootTypeMap(),
      this.printReturnTypeMap(),
      this.printArgTypeMap(),
      this.printAbstractResolveSourceTypeMap(),
      this.printAbstractResolveReturnTypeMap(),
      this.printTypeNames("object", "NexusGenObjectNames"),
      this.printTypeNames("input", "NexusGenInputNames"),
      this.printTypeNames("enum", "NexusGenEnumNames"),
      this.printTypeNames("interface", "NexusGenInterfaceNames"),
      this.printTypeNames("scalar", "NexusGenScalarNames"),
      this.printTypeNames("union", "NexusGenUnionNames"),
      this.printGenTypeMap(),
      this.printFooters(),
    ].join("\n\n");
  }

  printHeaders() {
    return [
      this.typegenInfo.headers.join("\n"),
      GRAPHQL_IMPORTS,
      this.typegenInfo.imports.join("\n"),
      GLOBAL_DECLARATION,
    ].join("\n");
  }

  printFooters() {
    return TYPEGEN_FOOTER;
  }

  printGenTypeMap() {
    return [`export interface NexusGenTypes {`]
      .concat([
        `  context: ${this.printContext()};`,
        `  rootTypes: NexusGenRootTypes;`,
        `  argTypes: NexusGenArgTypes;`,
        `  returnTypes: NexusGenReturnTypes;`,
        `  objectNames: NexusGenObjectNames;`,
        `  inputNames: NexusGenInputNames;`,
        `  enumNames: NexusGenEnumNames;`,
        `  interfaceNames: NexusGenInterfaceNames;`,
        `  scalarNames: NexusGenScalarNames;`,
        `  unionNames: NexusGenUnionNames;`,
        `  allInputTypes: NexusGenTypes['inputNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['scalarNames'];`,
        `  allOutputTypes: NexusGenTypes['objectNames'] | NexusGenTypes['enumNames'] | NexusGenTypes['unionNames'] | NexusGenTypes['interfaceNames'] | NexusGenTypes['enumNames'];`,
        `  allNamedTypes: NexusGenTypes['allInputTypes'] | NexusGenTypes['allOutputTypes']`,
        `  abstractTypes: NexusGenTypes['interfaceNames'] | NexusGenTypes['unionNames'];`,
        `  abstractResolveRoot: NexusGenAbstractResolveSourceTypes;`,
        `  abstractResolveReturn: NexusGenAbstractResolveReturnTypes;`,
      ])
      .concat("}")
      .join("\n");
  }

  printContext() {
    return this.typegenInfo.contextType || "{}";
  }

  printAbstractResolveSourceTypeMap() {
    return this.printTypeInterface(
      "NexusGenAbstractResolveSourceTypes",
      this.buildResolveSourceTypeMap()
    );
  }

  buildResolveSourceTypeMap() {
    const sourceMap: TypeMapping = {};
    const abstractTypes: (GraphQLInterfaceType | GraphQLUnionType)[] = [];
    abstractTypes
      .concat(this.groupedTypes.union)
      .concat(this.groupedTypes.interface)
      .sort()
      .forEach((type) => {
        if (isInterfaceType(type)) {
          sourceMap[type.name] = this.groupedTypes.interfaceMembers[type.name]
            .map((val) => `NexusGenRootTypes['${val}']`)
            .join(" | ");
        } else {
          sourceMap[type.name] = type
            .getTypes()
            .map((t) => `NexusGenRootTypes['${t.name}']`)
            .join(" | ");
        }
      });
    return sourceMap;
  }

  printAbstractResolveReturnTypeMap() {
    return this.printTypeInterface(
      "NexusGenAbstractResolveReturnTypes",
      this.buildResolveReturnTypesMap()
    );
  }

  buildResolveReturnTypesMap() {
    const sourceMap: TypeMapping = {};
    const abstractTypes: (GraphQLInterfaceType | GraphQLUnionType)[] = [];
    abstractTypes
      .concat(this.groupedTypes.union)
      .concat(this.groupedTypes.interface)
      .sort()
      .forEach((type) => {
        if (isInterfaceType(type)) {
          sourceMap[type.name] = this.groupedTypes.interfaceMembers[type.name]
            .map((val) => JSON.stringify(val))
            .join(" | ");
        } else {
          sourceMap[type.name] = type
            .getTypes()
            .map((t) => JSON.stringify(t.name))
            .join(" | ");
        }
      });
    return sourceMap;
  }

  printTypeNames(name: keyof GroupedTypes, exportName: string) {
    const obj = this.groupedTypes[name] as GraphQLNamedType[];
    const typeDef =
      obj.length === 0
        ? "never"
        : obj
            .map((o) => JSON.stringify(o.name))
            .sort()
            .join(" | ");
    return `export type ${exportName} = ${typeDef};`;
  }

  buildEnumTypeMap() {
    const enumMap: TypeMapping = {};
    this.groupedTypes.enum.forEach((e) => {
      const values = e.getValues().map((val) => JSON.stringify(val.value));
      enumMap[e.name] = values.join(" | ");
    });
    return enumMap;
  }

  buildInputTypeMap() {
    const inputObjMap: TypeFieldMapping = {};
    this.groupedTypes.input.forEach((input) => {
      eachObj(input.getFields(), (field) => {
        inputObjMap[input.name] = inputObjMap[input.name] || {};
        inputObjMap[input.name][field.name] = this.normalizeArg(field);
      });
    });
    return inputObjMap;
  }

  printInputTypeMap() {
    return this.printTypeFieldInterface(
      "NexusGenInputs",
      this.buildInputTypeMap(),
      "input type"
    );
  }

  printEnumTypeMap() {
    return this.printTypeInterface("NexusGenEnums", this.buildEnumTypeMap());
  }

  buildRootTypeMap() {
    const rootTypeMap: RootTypeMapping = {};
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = [];
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .sort()
      .forEach((type) => {
        const backingType = this.typegenInfo.backingTypeMap[type.name];
        if (typeof backingType === "string") {
          rootTypeMap[type.name] = backingType;
        } else {
          eachObj(type.getFields(), (field) => {
            const obj = (rootTypeMap[type.name] = rootTypeMap[type.name] || {});
            if (!this.metadata.hasResolver(type.name, field.name)) {
              if (typeof obj !== "string") {
                obj[field.name] = [
                  this.argSeparator(field.type as GraphQLType),
                  this.printOutputType(field.type),
                ];
              }
            }
          });
        }
      });
    return rootTypeMap;
  }

  printRootTypeMap() {
    return this.printRootTypeFieldInterface(
      "NexusGenRootTypes",
      this.buildRootTypeMap()
    );
  }

  buildArgTypeMap() {
    const argTypeMap: Record<string, TypeFieldMapping> = {};
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = [];
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .sort()
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          if (field.args.length > 0) {
            argTypeMap[type.name] = argTypeMap[type.name] || {};
            argTypeMap[type.name][field.name] = field.args.reduce(
              (obj: Record<string, string[]>, arg) => {
                obj[arg.name] = this.normalizeArg(arg);
                return obj;
              },
              {}
            );
          }
        });
      });
    return argTypeMap;
  }

  printArgTypeMap() {
    return this.printArgTypeFieldInterface(this.buildArgTypeMap());
  }

  buildReturnTypeMap() {
    const returnTypeMap: TypeFieldMapping = {};
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = [];
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .sort()
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          returnTypeMap[type.name] = returnTypeMap[type.name] || {};
          returnTypeMap[type.name][field.name] = [
            ":",
            this.printOutputType(field.type),
          ];
        });
      });
    return returnTypeMap;
  }

  printOutputType(type: GraphQLOutputType) {
    const returnType = this.typeToArr(type);
    function combine(item: any[]): string {
      if (item.length === 1) {
        if (Array.isArray(item[0])) {
          const toPrint = combine(item[0]);
          return toPrint.indexOf("null") === -1
            ? `${toPrint}[]`
            : `Array<${toPrint}>`;
        }
        return item[0];
      }
      if (Array.isArray(item[1])) {
        const toPrint = combine(item[1]);
        return toPrint.indexOf("null") === -1
          ? `${toPrint}[] | null`
          : `Array<${toPrint}> | null`;
      }
      return `${item[1]} | null`;
    }
    return `${combine(returnType)}; // ${type}`;
  }

  typeToArr(type: GraphQLOutputType): any[] {
    const typing = [];
    if (isNonNullType(type)) {
      type = type.ofType;
    } else {
      typing.push(null);
    }
    if (isListType(type)) {
      typing.push(this.typeToArr(type.ofType));
    } else if (isScalarType(type)) {
      typing.push(this.printScalar(type));
    } else if (isEnumType(type)) {
      typing.push(`NexusGenEnums['${type.name}']`);
    } else if (isObjectType(type)) {
      typing.push(`NexusGenRootTypes['${type.name}']`);
    }
    return typing;
  }

  printReturnTypeMap() {
    return this.printTypeFieldInterface(
      "NexusGenReturnTypes",
      this.buildReturnTypeMap(),
      "return type"
    );
  }

  normalizeArg(arg: GraphQLInputField | GraphQLArgument): [string, string] {
    return [this.argSeparator(arg.type), this.argTypeRepresentation(arg.type)];
  }

  argSeparator(type: GraphQLType) {
    if (isNonNullType(type)) {
      return ":";
    }
    return "?:";
  }

  argTypeRepresentation(arg: GraphQLType): string {
    const argType = this.argTypeArr(arg);
    function combine(item: any[]): string {
      if (item.length === 1) {
        if (Array.isArray(item[0])) {
          const toPrint = combine(item[0]);
          return toPrint.indexOf("null") === -1
            ? `${toPrint}[]`
            : `Array<${toPrint}>`;
        }
        return item[0];
      }
      if (Array.isArray(item[1])) {
        const toPrint = combine(item[1]);
        return toPrint.indexOf("null") === -1
          ? `${toPrint}[] | null`
          : `Array<${toPrint}> | null`;
      }
      return `${item[1]} | null`;
    }
    return `${combine(argType)}; // ${arg}`;
  }

  argTypeArr(arg: GraphQLType): any[] {
    const typing = [];
    if (isNonNullType(arg)) {
      arg = arg.ofType;
    } else {
      typing.push(null);
    }
    if (isListType(arg)) {
      typing.push(this.argTypeArr(arg.ofType));
    } else if (isScalarType(arg)) {
      typing.push(this.printScalar(arg));
    } else if (isEnumType(arg)) {
      typing.push(`NexusGenEnums['${arg.name}']`);
    } else if (isInputObjectType(arg)) {
      typing.push(`NexusGenInputs['${arg.name}']`);
    }
    return typing;
  }

  printTypeInterface(interfaceName: string, typeMapping: TypeMapping) {
    return [`interface ${interfaceName} {`]
      .concat(mapObj(typeMapping, (val, key) => `  ${key}: ${val}`))
      .concat("}")
      .join("\n");
  }

  printRootTypeFieldInterface(
    interfaceName: string,
    typeMapping: RootTypeMapping
  ) {
    return [`export interface ${interfaceName} {`]
      .concat(
        mapObj(typeMapping, (val, key) => {
          if (typeof val === "string") {
            return `  ${key}: ${val};`;
          }
          if (Object.keys(val).length === 0) {
            return `  ${key}: {};`;
          }
          return this.printObj("  ", "root types")(val, key);
        })
      )
      .concat("}")
      .join("\n");
  }

  printTypeFieldInterface(
    interfaceName: string,
    typeMapping: TypeFieldMapping,
    source: string
  ) {
    return [`export interface ${interfaceName} {`]
      .concat(mapObj(typeMapping, this.printObj("  ", source)))
      .concat("}")
      .join("\n");
  }

  printArgTypeFieldInterface(typeMapping: Record<string, TypeFieldMapping>) {
    return [`export interface NexusGenArgTypes {`]
      .concat(
        mapObj(typeMapping, (val, key) => {
          return [`  ${key}: {`]
            .concat(mapObj(val, this.printObj("    ", "args")))
            .concat("  }")
            .join("\n");
        })
      )
      .concat("}")
      .join("\n");
  }

  printObj = (space: string, source: string) => (
    val: Record<string, [string, string]>,
    key: string
  ) => {
    return [`${space}${key}: { // ${source}`]
      .concat(
        mapObj(val, (v2, k2) => {
          return `${space}  ${k2}${v2[0]} ${v2[1]}`;
        })
      )
      .concat(`${space}}`)
      .join("\n");
  };

  printScalar(type: GraphQLScalarType) {
    if (isSpecifiedScalarType(type)) {
      return SpecifiedScalars[type.name as keyof typeof SpecifiedScalars];
    }
    const backingType = this.typegenInfo.backingTypeMap[type.name];
    if (typeof backingType === "string") {
      return backingType;
    } else {
      return "any";
    }
  }
}

const GRAPHQL_IMPORTS = `import { GraphQLResolveInfo } from "graphql";`;

const GLOBAL_DECLARATION = `declare global {
  interface GraphQLNexusGen extends NexusGenTypes {}
}`;

const TYPEGEN_FOOTER = `export type Gen = NexusGenTypes;

type MaybePromise<T> = PromiseLike<T> | T;
type SourceType<TypeName> = TypeName extends keyof NexusGenAbstractResolveSourceTypes ? NexusGenAbstractResolveSourceTypes[TypeName] : never;
type RootType<TypeName> = TypeName extends keyof NexusGenRootTypes ? NexusGenRootTypes[TypeName] : never;
type ArgType<TypeName, FieldName> = TypeName extends keyof NexusGenArgTypes ? FieldName extends keyof NexusGenArgTypes[TypeName] ? NexusGenArgTypes[TypeName][FieldName] : {} : {};

export type NexusResolver<TypeName extends keyof NexusGenReturnTypes, FieldName extends keyof NexusGenReturnTypes[TypeName]> = (
  root: RootType<TypeName>, 
  args: ArgType<TypeName, FieldName>, 
  context: NexusGenTypes['context'], 
  info: GraphQLResolveInfo
) => MaybePromise<NexusGenReturnTypes[TypeName][FieldName]>

export type NexusAbstractTypeResolver<TypeName extends keyof NexusGenAbstractResolveReturnTypes> = (
  root: SourceType<TypeName>, 
  context: NexusGenTypes['context'], 
  info: GraphQLResolveInfo
) => MaybePromise<NexusGenAbstractResolveReturnTypes[TypeName]>
`;
