import {
  GraphQLArgument,
  GraphQLEnumType,
  GraphQLInputField,
  GraphQLInputObjectType,
  GraphQLInputType,
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
  object: GraphQLObjectType[];
  union: GraphQLUnionType[];
  enum: GraphQLEnumType[];
  scalar: GraphQLScalarType[];
}

type TypeFieldMapping = Record<string, Record<string, [string, string]>>;
type TypeMapping = Record<string, string>;

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
    object: [],
    union: [],
    enum: [],
    scalar: [],
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
      } else if (isInputObjectType(type)) {
        this.groupedTypes.input.push(type);
      } else if (isScalarType(type)) {
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
      this.buildInputTypeMap()
    );
  }

  printEnumTypeMap() {
    return this.printTypeInterface("NexusGenEnums", this.buildEnumTypeMap());
  }

  buildRootTypeMap() {}

  buildArgTypeMap() {
    const argTypeMap: Record<string, TypeFieldMapping> = {};
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = [];
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
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
    return this.printTypeTypeFieldInterface(
      "NexusArgMap",
      this.buildArgTypeMap()
    );
  }

  buildReturnTypeMap() {
    const returnTypeMap: TypeFieldMapping = {};
    const hasFields: (GraphQLInterfaceType | GraphQLObjectType)[] = [];
    hasFields
      .concat(this.groupedTypes.object)
      .concat(this.groupedTypes.interface)
      .forEach((type) => {
        eachObj(type.getFields(), (field) => {
          returnTypeMap[type.name] = returnTypeMap[type.name] || {};
          returnTypeMap[type.name][field.name] = [
            ":",
            this.printReturnType(field.type),
          ];
        });
      });
    return returnTypeMap;
  }

  printReturnType(type: GraphQLOutputType) {
    return type.toString();
  }

  printReturnTypeMap() {
    return this.printTypeFieldInterface(
      "NexusGenReturns",
      this.buildReturnTypeMap()
    );
  }

  makeReturnType(type: GraphQLOutputType) {
    if (isScalarType(type) && isSpecifiedScalarType(type)) {
      return type.toString();
    }
    return type.inspect();
  }

  normalizeArg(arg: GraphQLInputField | GraphQLArgument): [string, string] {
    return [this.argSeparator(arg.type), this.argTypeRepresentation(arg.type)];
  }

  argSeparator(arg: GraphQLInputType) {
    if (isNonNullType(arg)) {
      return ":";
    }
    return "?:";
  }

  argTypeRepresentation(arg: GraphQLInputType): string {
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
    return `${combine(argType)} // ${arg}`;
  }

  argTypeArr(arg: GraphQLInputType): any[] {
    const typing = [];
    if (isNonNullType(arg)) {
      arg = arg.ofType;
    } else {
      typing.push(null);
    }
    if (isListType(arg)) {
      typing.push(this.argTypeArr(arg.ofType));
    } else if (isScalarType(arg)) {
      if (isSpecifiedScalarType(arg)) {
        typing.push(
          SpecifiedScalars[arg.name as keyof typeof SpecifiedScalars]
        );
      } else {
        typing.push(`NexusGenScalars['${arg.name}']`);
      }
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

  printTypeFieldInterface(
    interfaceName: string,
    typeMapping: TypeFieldMapping
  ) {
    return [`interface ${interfaceName} {`]
      .concat(mapObj(typeMapping, this.printObj("  ")))
      .concat("}")
      .join("\n");
  }

  printTypeTypeFieldInterface(
    interfaceName: string,
    typeMapping: Record<string, TypeFieldMapping>
  ) {
    return [`interface ${interfaceName} {`]
      .concat(
        mapObj(typeMapping, (val, key) => {
          return [`  ${key}: {`]
            .concat(mapObj(val, this.printObj("    ")))
            .concat("  }")
            .join("\n");
        })
      )
      .concat("}")
      .join("\n");
  }

  printObj = (space: string) => (
    val: Record<string, [string, string]>,
    key: string
  ) => {
    return [`${space}${key}: {`]
      .concat(
        mapObj(val, (v2, k2) => {
          return `${space}  ${k2}${v2[0]} ${v2[1]}`;
        })
      )
      .concat(`${space}}`)
      .join("\n");
  };
}
