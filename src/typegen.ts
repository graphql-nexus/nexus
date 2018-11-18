import {
  GraphQLArgument,
  GraphQLField,
  GraphQLInputField,
  GraphQLInputType,
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLSchema,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
} from "graphql";
import { TYPEGEN_HEADER } from "./lang";
import { mapObj, eachObj, arrPush } from "./utils";
import { GQLiteralMetadata } from "./metadata";

const SCALAR_TYPES = {
  Int: "number",
  String: "string",
  ID: "string",
  Float: "number",
  Date: "Date",
  JSON: "any",
  Boolean: "boolean",
};

type AllTypes =
  | "enums"
  | "objects"
  | "inputObjects"
  | "interfaces"
  | "scalars"
  | "unions";

// This is intentionally concise and self contained, since it shouldn't be
// unnecessarily abstracted and should run only with only a single iteration
// of the schema. The types created here are generally meant for internal use
// by GQLiteral. If we find a need, this could be factored out into the
export function buildTypeDefinitions(
  schema: GraphQLSchema,
  metadata: GQLiteralMetadata
) {
  const schemaTypeMap = schema.getTypeMap();
  const scalarMapping: Record<string, string> = {
    ...SCALAR_TYPES,
  };

  // Keeping track of all of the types we have for each
  // type in the schema.
  const typeNames: Record<AllTypes, string[]> = {
    enums: [],
    objects: [],
    inputObjects: [],
    interfaces: [],
    scalars: [],
    unions: [],
  };
  const allTypeStrings: string[] = [];

  const rootTypeImports: {
    [importPath: string]: [string, string][]; // [importName, alias][]
  } = {};
  const interfaceRootTypes: {
    [interfaceName: string]: string[]; // objectRootType
  } = {};
  const returnTypeFields: {
    [typeName: string]: [string, string][]; // fieldName, returnTypeName
  } = {};
  const argTypeFields: {
    [typeName: string]: [string, string][]; // fieldName, argTypeName
  } = {};

  // If for some reason the user has types that conflict with the type names,
  // rename them.
  let MP = "MP";
  let MPL = "MPL";
  let MT = "MT";
  let MTA = "MTA";
  if (schema.getType("MP")) {
    MP = "_MP";
  }
  if (schema.getType("MPL")) {
    MPL = "_MPL";
  }
  if (schema.getType("MT")) {
    MT = "_MT";
  }
  if (schema.getType("MTA")) {
    MTA = "_MTA";
  }

  function argFieldName(fieldName: string, typeName: string) {
    return `${typeName}${ucFirst(fieldName)}Args`;
  }
  function makeReturnTypeName(fieldName: string, typeName: string) {
    return `${typeName}${ucFirst(fieldName)}ReturnType`;
  }

  // Takes a type and turns it into a "return type", based
  // on nullability and whether it's a list.
  function getReturnType(fieldType: GraphQLOutputType): string {
    let type = fieldType;
    let typeStr = "";
    if (isNonNullType(fieldType)) {
      type = fieldType.ofType;
    } else {
      typeStr += "null | ";
    }
    if (isListType(type)) {
      return `${MP}<${typeStr}${MPL}<${getReturnType(type.ofType)}>>`;
    }
    if (isObjectType(type) || isInterfaceType(type) || isUnionType(type)) {
      typeStr += `${type.name}ReturnType`;
    } else if (isEnumType(type)) {
      typeStr += type.name;
    } else if (isScalarType(type)) {
      typeStr += scalarMapping[type.name];
    }
    return `${MP}<${typeStr}>`;
  }

  function printInputType(fieldType: GraphQLInputType): string {
    let type = fieldType;
    let typeStr = "";
    if (isNonNullType(fieldType)) {
      type = fieldType.ofType;
    } else {
      typeStr += "null | ";
    }
    if (isListType(type)) {
      return typeStr
        ? `Array<${typeStr}${printInputType(type.ofType)}>`
        : `${printInputType(type.ofType)}[]`;
    }
    if (isInputObjectType(type) || isEnumType(type)) {
      return type.name;
    }
    if (isScalarType(type)) {
      return scalarMapping[type.name] || "unknown";
    }
    throw new Error(`Unexpected type ${type}`);
  }

  function printArgOrFieldMember({
    name,
    type,
  }: GraphQLArgument | GraphQLInputField): string {
    if (isNonNullType(type)) {
      return `  ${name}: ${printInputType(type)};`;
    }
    return `  ${name}?: ${printInputType(type)};`;
  }

  function makeFieldArgs(argTypeName: string, field: GraphQLField<any, any>) {
    allTypeStrings.push(
      [
        `export interface ${argTypeName} {`,
        map(field.args, (arg) => printArgOrFieldMember(arg)),
        "}",
      ].join("\n")
    );
  }

  function processField(
    type: GraphQLObjectType | GraphQLInterfaceType,
    field: GraphQLField<any, any>
  ) {
    const returnTypeName = makeReturnTypeName(field.name, type.name);
    arrPush(returnTypeFields, type.name, [field.name, returnTypeName]);
    allTypeStrings.push(
      `type ${returnTypeName} = ${getReturnType(field.type)};`
    );
    if (field.args.length) {
      const argTypeName = argFieldName(field.name, type.name);
      arrPush(argTypeFields, type.name, [field.name, argTypeName]);
      if (isObjectType(type)) {
        const interfaces = type
          .getInterfaces()
          .filter((i) => i.getFields()[field.name])
          .map((i) => argFieldName(field.name, i.name));
        if (interfaces.length) {
          allTypeStrings.push(
            `export interface ${argTypeName} extends ${interfaces.join(
              ", "
            )} {}`
          );
        } else {
          makeFieldArgs(argTypeName, field);
        }
      } else {
        makeFieldArgs(argTypeName, field);
      }
    }
  }

  function fieldRootType(fieldType: GraphQLOutputType): string {
    let type = fieldType;
    let typeStr = "";
    if (isNonNullType(fieldType)) {
      type = fieldType.ofType;
    } else {
      typeStr += "null | ";
    }
    if (isListType(type)) {
      const toWrap = fieldRootType(type.ofType);
      return toWrap.indexOf("null | ") === 0
        ? `${typeStr}Array<${toWrap}>`
        : `${typeStr}${toWrap}[]`;
    }
    if (isScalarType(type)) {
      return `${typeStr}${scalarMapping[type.name] || "any"}`;
    }
    if (isObjectType(type)) {
      // return field.
    }
    if (isEnumType(type)) {
      return `${typeStr}${type.name}`;
    }
    return `${typeStr}any`;
  }

  function fieldBackingName(typeName: string, field: GraphQLField<any, any>) {
    const colon = metadata.hasDefaultValue(typeName, field.name)
      ? "?:"
      : isNonNullType(field.type)
        ? ":"
        : "?:";
    if (metadata.hasPropertyResolver(typeName, field.name)) {
      return `${metadata.getPropertyResolver(typeName, field.name)}${colon}`;
    }
    return `${field.name}${colon}`;
  }

  function getOrMakeRootType(type: GraphQLObjectType) {
    if (metadata.hasRootTyping(type.name)) {
      allTypeStrings.push(
        `type ${type.name}RootType = ${metadata.getRootTyping(type.name)};`
      );
      allTypeStrings.push(
        `type ${type.name}ReturnType = ${metadata.getRootTyping(type.name)}`
      );
    } else {
      const rootMembers = mapObj(type.getFields(), (f) => {
        if (metadata.hasResolver(type.name, f.name)) {
          return null;
        }
        return `  ${fieldBackingName(type.name, f)} ${fieldRootType(f.type)};`;
      }).filter((f) => f);
      if (rootMembers.length === 0) {
        allTypeStrings.push(`type ${type.name}RootType = {};`);
      } else {
        allTypeStrings.push(
          [
            `interface ${type.name}RootType {`,
            rootMembers.join("\n"),
            `}`,
          ].join("\n")
        );
      }
      const returnMembers = mapObj(type.getFields(), (f) => {
        if (metadata.hasResolver(type.name, f.name)) {
          return null;
        }
        return `  ${fieldBackingName(type.name, f)} ${fieldRootType(f.type)};`;
      }).filter((f) => f);
      if (returnMembers.length === 0) {
        allTypeStrings.push(`type ${type.name}ReturnType = {};`);
      } else {
        allTypeStrings.push(
          [
            `interface ${type.name}ReturnType {`,
            returnMembers.join("\n"),
            `}`,
          ].join("\n")
        );
      }
    }
  }

  Object.keys(schemaTypeMap).forEach((typeName) => {
    if (typeName.indexOf("__") === 0) {
      return;
    }
    // All types will be "unused" until we say otherwise,
    // if we need to strip them.
    const type = schema.getType(typeName);

    // An object type has a "backing type", and fields
    // which may have an "arg type" and have a "return type"
    if (isObjectType(type)) {
      typeNames.objects.push(type.name);
      eachObj(type.getFields(), (field) => processField(type, field));
      type
        .getInterfaces()
        .forEach((i) => arrPush(interfaceRootTypes, i.name, type.name));
      getOrMakeRootType(type);
    } else if (isInputObjectType(type)) {
      typeNames.inputObjects.push(type.name);
      allTypeStrings.push(
        [
          `interface ${type.name} {`,
          mapObj(type.getFields(), (inputField) =>
            printArgOrFieldMember(inputField)
          ).join("\n"),
          `}`,
        ].join("\n")
      );
    } else if (isScalarType(type)) {
      typeNames.scalars.push(type.name);
    } else if (isUnionType(type)) {
      typeNames.unions.push(type.name);
      allTypeStrings.push(
        `type ${type.name}RootType = ${map(
          type.getTypes(),
          ({ name }) => `${name}RootType`,
          " | "
        )}`
      );
      allTypeStrings.push(
        `type ${type.name}ReturnType = ${map(
          type.getTypes(),
          ({ name }) => `${name}ReturnType`,
          " | "
        )}`
      );
    } else if (isInterfaceType(type)) {
      typeNames.interfaces.push(type.name);
      eachObj(type.getFields(), (field) => processField(type, field));
    } else if (isEnumType(type)) {
      typeNames.enums.push(type.name);
      allTypeStrings.push(
        `export type ${type.name} = ${map(
          type.getValues(),
          ({ value }) => JSON.stringify(value),
          " | "
        )};`
      );
    }
  });

  eachObj(interfaceRootTypes, (members, interfaceName) => {
    allTypeStrings.push(
      `type ${interfaceName}RootType = ${members
        .map((name) => `${name}RootType`)
        .join(" | ")}`
    );
    allTypeStrings.push(
      `type ${interfaceName}ReturnType = ${members
        .map((name) => `${name}ReturnType`)
        .join(" | ")}`
    );
  });

  const rootTypeImportStrings = Object.keys(rootTypeImports).map((path) => {
    return `import {${map(
      rootTypeImports[path],
      ([importName, alias]) => `${importName} as ${alias}`,
      ", "
    )}} from ${path}`;
  });

  return `${TYPEGEN_HEADER}
${rootTypeImportStrings.join("\n")}

// Maybe Promise
type ${MP}<T> = PromiseLike<T> | T;

// Maybe Promise List
type ${MPL}<T> = ${MP}<T>[];

// Maybe Thunk
type ${MT}<T> = T | (() => T);

// Maybe Thunk, with args
type ${MTA}<T, A> = T | ((args?: A) => T);

${allTypeStrings.join("\n\n")}

${stringifyTypeFieldMapping("GQLiteralGenArgTypes", argTypeFields)}

interface GQLiteralGenRootTypes {
${map(
    typeNames.interfaces.concat(typeNames.objects),
    (name) => `  ${name}: ${name}RootType;`
  )}
}

${stringifyTypeFieldMapping("GQLiteralGenReturnTypes", returnTypeFields)}

interface GQLiteralGenTypes {
  argTypes: GQLiteralGenArgTypes;
  rootTypes: GQLiteralGenRootTypes;
  returnTypes: GQLiteralGenReturnTypes;
}

export type Gen = GQLiteralGenTypes;

declare global {
  interface GQLiteralGen extends GQLiteralGenTypes {}
}
`;
}

function stringifyTypeMapping(tsInterfaceName: string) {}

function stringifyTypeFieldMapping(
  tsInterfaceName: string,
  obj: Record<string, [string, string][]>
) {
  const argTypeLines = Object.keys(obj).reduce((result: string[], typeName) => {
    return result
      .concat(`  ${typeName}: {`)
      .concat(
        obj[typeName].reduce((fields: string[], [fieldName, mappingName]) => {
          return fields.concat(`    ${fieldName}: ${mappingName};`);
        }, [])
      )
      .concat("  };");
  }, []);

  const argTypes = [`interface ${tsInterfaceName} {`]
    .concat(argTypeLines)
    .concat("}")
    .join("\n");

  return argTypes;
}

function map<T>(
  nodes: Set<T> | Array<T>,
  iterator: (item: T, index: number) => string,
  join = "\n"
) {
  return Array.from(nodes)
    .map(iterator)
    .join(join);
}

function ucFirst(fieldName: string) {
  return fieldName
    .slice(0, 1)
    .toUpperCase()
    .concat(fieldName.slice(1));
}
