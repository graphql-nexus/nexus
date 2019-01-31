import {
  buildSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  GraphQLField,
  GraphQLSchema,
  GraphQLNamedType,
} from "graphql";
import { groupTypes, GroupedTypes } from "./utils";

export function convertSDL(sdl: string, commonjs: boolean = false) {
  return new SDLConverter(commonjs, sdl).print();
}

/**
 * Convert an existing SDL schema into a Nexus GraphQL format
 */
export class SDLConverter {
  protected export: string;
  protected schema: GraphQLSchema;
  protected groupedTypes: GroupedTypes;

  constructor(commonjs: boolean = false, sdl: string) {
    this.export = commonjs ? "exports." : "export const ";
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
    ].join("\n\n");
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
    return this.printBlock([
      `${this.export}${type.name} = objectType({`,
      `  name: "${type.name}"`,
      `})`,
    ]);
    // if (type.getInterfaces().length > 0) {
    //   const interfaceNames = type
    //     .getInterfaces()
    //     .map((i) => JSON.stringify(i.name))
    //     .join(", ");
    //   str.push(`  t.implements(${interfaceNames})`);
    // }
    // Object.keys(type.getFields()).forEach((fieldName) => {
    //   if (isInterfaceField(type, fieldName)) {
    //     return;
    //   }
    //   eachObj(type.getFields(), (field, key) => {
    //     getFieldType(field);
    //   });
    // });
    // return str.join("\n");
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
      `  }`,
      `});`,
    ]);
    // eachObj(type.getFields(), (field, key) => {
    //   getFieldType(field);
    // });
    // return str.join("\n");
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
    return this.printBlock([
      `${this.export}${type.name} = enumType({`,
      `  name: "${type.name}",`,
      this.maybeDescription(type),
      `  definition(t) {`,
      `  }`,
      `});`,
    ]);
  }

  printInputObjectTypes() {
    if (this.groupedTypes.input.length) {
      return this.groupedTypes.input.map((t) => this.printInputObjectType(t));
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
        .map((t) => this.printScalarType(t))
        .join("\n");
    }
    return "";
  }

  printScalarType(type: GraphQLScalarType): string {
    return this.printBlock([
      `${this.export}${type.name} = scalarType({`,
      `  name: ${type.name}",`,
      this.maybeDescription(type),
      `  definition(t) {`,
      `  }`,
      `});`,
    ]);
  }

  maybeDescription(type: GraphQLNamedType) {
    if (type.description) {
      return `  description: ${JSON.stringify(type.description)},`;
    }
    return null;
  }

  printBlock(block: (string | null)[]) {
    return block.filter((t) => t !== null).join("\n");
  }
}

const getFieldType = (type: GraphQLField<any, any>) => {
  //
};

const getInputFieldType = (type: GraphQLField<any, any>) => {
  //
};
