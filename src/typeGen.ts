import fs from "fs";
import util from "util";
import { compileTemplate } from "graphql-codegen-compiler";
import { schemaToTemplateContext, GraphQLSchema } from "graphql-codegen-core";

const writeFile = util.promisify(fs.writeFile);

export interface GQLiteralTypegenOptions {
  typesFilePath: string;
  backingTypes?: object;
  typeGenPrefix?: string;
}

export function GQLiteralTypegen(options: GQLiteralTypegenOptions) {
  return async (schema: GraphQLSchema) => {
    const context = schemaToTemplateContext(schema);
    const data = await compileTemplate(makeTypes(options), context);
    await Promise.all(
      data.map(async ({ filename, content }) => {
        await writeFile(filename, content);
      })
    );
    return options;
  };
}

import prettier from "prettier";
import { CustomProcessingFunction } from "graphql-codegen-core";

export interface GQLiteralTypegenOptions {
  typesFilePath: string;
  backingTypes?: object;
  typeGenPrefix?: string;
}

export const makeTypes = (
  options: GQLiteralTypegenOptions
): CustomProcessingFunction => (context) => {
  const prefix = options.typeGenPrefix || "GQLiteralGenerated";
  const tmpl = `
  export type BaseScalarNames = "String" | "Int" | "Float" | "ID" | "Boolean";

  export type ${prefix}Scalars = {
    ${map(context.scalars, (scalar) => `${scalar.name}: any;`)}
  }
  export type ${prefix}Interfaces = {
    ${map(context.interfaces, (i) => {
      return `${i.name}: {
        members: '${i.implementingTypes.join("'|'")}';
        fields: {
          ${map(i.fields, (field) => {
            return `${field.name}: {
              type: any;
              args: {
                ${map(field.arguments, (arg) => {
                  return `${arg.name}: any`;
                })}
              }
            };`;
          })}
        }
      }`;
    })}
  }
  export type ${prefix}Unions = {}
  export type ${prefix}Enums = {
    ${map(context.enums, (e) => {
      return `${e.name}: any;`;
    })}
  }
  export type ${prefix}InputObjects = {
    ${map(context.inputTypes, (i) => {
      return `${i.name}: any;`;
    })}
  }
  export type ${prefix}Objects = {
    ${map(context.types, (t) => {
      return `${t.name}: {
        backingType: any;
        fields: {
          ${map(t.fields, (field) => {
            return `${field.name}: {
              type: any;
              args: {
                ${map(field.arguments, (arg) => {
                  return `${arg.name}: any`;
                })}
              }
            };`;
          })}
        }
      }`;
    })}
  }
  export type ${prefix}Schema = {
    enums: ${prefix}Enums;
    objects: ${prefix}Objects;
    inputObjects: ${prefix}InputObjects;
    unions: ${prefix}Unions;
    scalars: ${prefix}Scalars;
    interfaces: ${prefix}Interfaces;
    
    // For simplicity in autocomplete:
    availableInputTypes: BaseScalarNames 
      | Extract<keyof ${prefix}InputObjects, string>
      | Extract<keyof ${prefix}Enums, string>
      | Extract<keyof ${prefix}Scalars, string>;
    availableOutputTypes: BaseScalarNames 
      | Extract<keyof ${prefix}Objects, string>
      | Extract<keyof ${prefix}Enums, string>
      | Extract<keyof ${prefix}Unions, string>
      | Extract<keyof ${prefix}Interfaces, string>
      | Extract<keyof ${prefix}Scalars, string>;
  }
  export type Gen = ${prefix}Schema;
  `;
  const content = prettier.format(tmpl, {
    parser: "typescript",
  });

  return [{ filename: options.typesFilePath, content }];
};

type Mapper<T> = (item: T, index: number) => string;

function map<T>(arr: T[], mapper: Mapper<T>) {
  return arr.map(mapper).join("\n");
}
