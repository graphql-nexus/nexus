import {
  buildSchema,
  lexicographicSortSchema,
  isObjectType,
  isInterfaceType,
  isScalarType,
  isInputObjectType,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLScalarType,
  GraphQLUnionType,
  isUnionType,
  isEnumType,
  GraphQLField,
} from "graphql";
import { isInterfaceField, eachObj } from "./utils";

export function convertSDL(sdl: string, commonjs: boolean = false) {
  return new SDLConverter(commonjs).convert(sdl);
}

/**
 * Convert an existing SDL schema into a GraphQL Nexus format
 */
export class SDLConverter {
  protected export: string;

  constructor(commonjs: boolean = false) {
    this.export = commonjs ? "exports." : "export const ";
  }

  convert(sdl: string) {
    let schema = buildSchema(sdl);
    if (typeof lexicographicSortSchema === "function") {
      schema = lexicographicSortSchema(schema);
    }
    const typeMap = schema.getTypeMap();
    const typeFragments: string[] = [];
    Object.keys(typeMap).forEach((typeName) => {
      if (typeName.indexOf("__") === 0) {
        return;
      }
      const type = typeMap[typeName];
      if (isObjectType(type)) {
        typeFragments.push(this.makeObjectType(type));
      } else if (isInterfaceType(type)) {
        typeFragments.push(this.makeInterfaceType(type));
      } else if (isUnionType(type)) {
        typeFragments.push(this.makeUnionType(type));
      } else if (isEnumType(type)) {
        typeFragments.push(this.makeEnumType(type));
      } else if (isScalarType(type)) {
        typeFragments.push(this.makeScalarType(type));
      } else if (isInputObjectType(type)) {
        typeFragments.push(this.makeInputObjectType(type));
      }
    });
    return typeFragments.join("\n\n");
  }

  makeObjectType(type: GraphQLObjectType): string {
    const str = [
      `${this.export}${type.name} = objectType("${type.name}", t => {`,
    ];
    if (type.getInterfaces().length > 0) {
      str.push(
        `  t.implements("${type
          .getInterfaces()
          .map((i) => i.name)
          .join('", "')}")`
      );
    }
    Object.keys(type.getFields()).forEach((fieldName) => {
      if (isInterfaceField(type, fieldName)) {
        return;
      }
      eachObj(type.getFields(), (field, key) => {
        getFieldType(field);
      });
    });
    return str.concat("});").join("\n");
  }

  makeEnumType(type: GraphQLEnumType): string {
    const str = [
      `${this.export}${type.name} = enumType("${type.name}", t => {`,
    ];

    return str.concat("});").join("\n");
  }

  makeInterfaceType(type: GraphQLInterfaceType): string {
    const str = [
      `${this.export}${type.name} = interfaceType("${type.name}", t => {`,
    ];
    eachObj(type.getFields(), (field, key) => {
      getFieldType(field);
    });
    return str.concat("});").join("\n");
  }

  makeInputObjectType(type: GraphQLInputObjectType): string {
    const str = [
      `${this.export}${type.name} = inputObjectType("${type.name}", t => {`,
    ];

    return str.concat("});").join("\n");
  }

  makeUnionType(type: GraphQLUnionType): string {
    const str = [
      `${this.export}${type.name} = unionType("${type.name}", t => {`,
    ];

    return str.concat("});").join("\n");
  }

  makeScalarType(type: GraphQLScalarType): string {
    const str = [
      `${this.export}${type.name} = scalarType("${type.name}", t => {`,
    ];

    return str.concat("});").join("\n");
  }
}

const getFieldType = (type: GraphQLField<any, any>) => {
  //
};

const getInputFieldType = (type: GraphQLField<any, any>) => {
  //
};
