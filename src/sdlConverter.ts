import {
  buildSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  GraphQLSchema,
  GraphQLNamedType,
  isSpecifiedScalarType,
  GraphQLField,
  isWrappingType,
  isNonNullType,
  isListType,
  GraphQLOutputType,
  GraphQLWrappingType,
  isScalarType,
  isObjectType,
} from "graphql";
import { groupTypes, GroupedTypes, isInterfaceField, objValues } from "./utils";

export function convertSDL(
  sdl: string,
  commonjs: null | boolean = false,
  json = JSON
) {
  try {
    return new SDLConverter(sdl, commonjs, json).print();
  } catch (e) {
    return `Error Parsing SDL into Schema: ${e.stack}`;
  }
}

/**
 * Convert an existing SDL schema into a Nexus GraphQL format
 */
export class SDLConverter {
  protected export: string;
  protected schema: GraphQLSchema | null;
  protected groupedTypes: GroupedTypes;

  constructor(
    sdl: string,
    commonjs: null | boolean = false,
    protected json: JSON = JSON
  ) {
    this.export =
      commonjs === null ? "const " : commonjs ? "exports." : "export const ";
    this.schema = buildSchema(sdl);
    this.groupedTypes = groupTypes(this.schema);
  }

  print() {
    return [
      this.printObjectTypes(),
      this.printInterfaceTypes(),
      this.printInputObjectTypes(),
      this.printUnionTypes(),
      this.printEnumTypes(),
      this.printScalarTypes(),
    ]
      .filter((f) => f)
      .join("\n\n");
  }

  printObjectTypes() {
    if (this.groupedTypes.object.length > 0) {
      return this.groupedTypes.object
        .map((t) => this.printObjectType(t))
        .join("\n");
    }
    return "";
  }

  printObjectType(type: GraphQLObjectType): string {
    const implementing = type.getInterfaces().map((i) => i.name);
    const implementsInterfaces =
      implementing.length > 0
        ? `    t.implements(${implementing
            .map((i) => this.json.stringify(i))
            .join(", ")})`
        : "";
    return this.printBlock([
      `${this.export}${type.name} = objectType({`,
      `  name: "${type.name}",`,
      `  definition(t) {`,
      implementsInterfaces,
      this.printObjectFields(type),
      `  }`,
      `})`,
    ]);
  }

  printObjectFields(type: GraphQLObjectType | GraphQLInterfaceType) {
    return objValues(type.getFields())
      .map((field) => {
        if (isObjectType(type) && isInterfaceField(type, field.name)) {
          return;
        }
        return this.printField("output", field);
      })
      .filter((f) => f)
      .join("\n");
  }

  printField(source: "input" | "output", field: GraphQLField<any, any>) {
    let fieldType = field.type;
    let isNonNull = false;
    const list = [];
    while (isWrappingType(fieldType)) {
      while (isListType(fieldType)) {
        fieldType = fieldType.ofType;
        if (isNonNullType(fieldType)) {
          fieldType = fieldType.ofType;
          list.unshift(true);
        } else {
          list.unshift(false);
        }
      }
      if (isNonNullType(fieldType)) {
        isNonNull = true;
        fieldType = fieldType.ofType;
      }
    }
    const prefix = list.length === 1 ? `t.list.` : `t.`;
    return `    ${prefix}${this.printFieldMethod(
      source,
      field,
      fieldType,
      list,
      isNonNull
    )}`;
  }

  printFieldMethod(
    source: "input" | "output",
    field: GraphQLField<any, any>,
    type: Exclude<GraphQLOutputType, GraphQLWrappingType>,
    list: boolean[],
    isNonNull: boolean
  ) {
    const objectMeta: Record<string, any> = {};
    if (field.description) {
      objectMeta.description = field.description;
    }
    if (field.deprecationReason) {
      objectMeta.deprecation = field.deprecationReason;
    }
    if (list.length > 1) {
      objectMeta.list = list;
    }
    if (!isNonNull && source === "output") {
      objectMeta.nullable = true;
    } else if (isNonNull && source === "input") {
      objectMeta.required = true;
    }
    let str = "";
    if (isCommonScalar(type)) {
      str += `${type.name.toLowerCase()}("${field.name}"`;
    } else {
      objectMeta.type = type;
      str += `field("${field.name}"`;
    }
    if (Object.keys(objectMeta).length > 0) {
      str += `, ${this.json.stringify(objectMeta)}`;
    }
    return `${str})`;
  }

  printInterfaceTypes() {
    if (this.groupedTypes.interface.length) {
      return this.groupedTypes.interface
        .map((t) => this.printInterfaceType(t))
        .join("\n");
    }
    return "";
  }

  printInterfaceType(type: GraphQLInterfaceType): string {
    return this.printBlock([
      `${this.export}${type.name} = interfaceType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      `  definition(t) {`,
      this.printObjectFields(type),
      `  }`,
      `});`,
    ]);
  }

  printEnumTypes() {
    if (this.groupedTypes.enum.length) {
      return this.groupedTypes.enum
        .map((t) => this.printEnumType(t))
        .join("\n");
    }
    return "";
  }

  printEnumType(type: GraphQLEnumType): string {
    const members = type.getValues().map((val) => {
      const { description, name, deprecationReason, value } = val;
      if (!description && !deprecationReason && name === value) {
        return val.name;
      }
      return { description, name, deprecated: deprecationReason, value };
    });
    return this.printBlock([
      `${this.export}${type.name} = enumType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      `  members: ${this.json.stringify(members)},`,
      `});`,
    ]);
  }

  printInputObjectTypes() {
    if (this.groupedTypes.input.length) {
      return this.groupedTypes.input
        .map((t) => this.printInputObjectType(t))
        .join("\n");
    }
    return "";
  }

  printInputObjectType(type: GraphQLInputObjectType): string {
    return this.printBlock([
      `${this.export}${type.name} = inputObjectType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      `  definition(t) {`,
      `  }`,
      `});`,
    ]);
  }

  printUnionTypes() {
    if (this.groupedTypes.union.length) {
      return this.groupedTypes.union
        .map((t) => this.printUnionType(t))
        .join("\n");
    }
    return "";
  }

  printUnionType(type: GraphQLUnionType): string {
    return this.printBlock([
      `${this.export}${type.name} = unionType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      `  definition(t) {`,
      `  }`,
      `});`,
    ]);
  }

  printScalarTypes() {
    if (this.groupedTypes.scalar.length) {
      return this.groupedTypes.scalar
        .filter((s) => !isSpecifiedScalarType(s))
        .map((t) => this.printScalarType(t))
        .join("\n");
    }
    return "";
  }

  printScalarType(type: GraphQLScalarType): string {
    return this.printBlock([
      `${this.export}${type.name} = scalarType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      this.maybeAsNexusType(type),
      `  serialize() { /* Todo */ },`,
      `  parseValue() { /* Todo */ },`,
      `  parseLiteral() { /* Todo */ }`,
      `});`,
    ]);
  }

  maybeAsNexusType(type: GraphQLScalarType) {
    if (isCommonScalar(type)) {
      return `  asNexusMethod: "${type.name.toLowerCase()}",`;
    }
    return null;
  }

  maybeDescription(type: GraphQLNamedType) {
    if (type.description) {
      return `  description: ${JSON.stringify(type.description)},`;
    }
    return null;
  }

  printBlock(block: (string | null)[]) {
    return block.filter((t) => t !== null && t !== "").join("\n");
  }
}

function isCommonScalar(field: GraphQLOutputType): boolean {
  if (isScalarType(field)) {
    return (
      isSpecifiedScalarType(field) ||
      field.name === "UUID" ||
      field.name === "Date"
    );
  }
  return false;
}
