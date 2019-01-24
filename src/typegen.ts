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
  GraphQLUnionType,
} from "graphql";
import { Metadata } from "./metadata";
import { arrPush, eachObj, mapObj, hasField } from "./utils";

type AllTypes =
  | "enums"
  | "objects"
  | "inputObjects"
  | "interfaces"
  | "scalars"
  | "unions";

// This is intentionally concise and procedural. Didn't want to make this
// unnecessarily abstracted and it should run only with only a single iteration
// of the schema. The types created here are generally meant for internal use
// by GraphQLNexus anyway. If there is a need, this could be factored out into
// something nicer, but for now let's just make it work well, however ugly it is.
// At least it's type safe™
export async function buildTypeDefinitions(
  schema: GraphQLSchema,
  metadata: Metadata
) {
  const {
    headers,
    backingTypeMap,
    contextType,
    imports,
  } = await metadata.getTypegenInfo(schema);

  const schemaTypeMap = schema.getTypeMap();

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

  const interfaceRootTypes: {
    [interfaceName: string]: GraphQLObjectType[]; // objectRootType
  } = {};
  const returnTypeFields: {
    [typeName: string]: [string, string][]; // fieldName, returnTypeName
  } = {};
  const argTypeFields: {
    [typeName: string]: [string, string][]; // fieldName, argTypeName
  } = {};

  // If for some reason the user has types that conflict with these type names rename them.
  const MP = metadata.safeTypeName(schema, "MaybePromise");
  const MPL = metadata.safeTypeName(schema, "MaybePromiseList");
  const MT = metadata.safeTypeName(schema, "MaybeThunk");
  const MTA = metadata.safeTypeName(schema, "MaybeThunkArgs");

  const maybePromiseList = (t: string) => `${MPL}<${t}>`;
  const maybePromise = (t: string) => `${MP}<${t}>`;
  const maybeThunk = (t: string) => `${MT}<${t}>`;
  const maybeThunkWithArgs = (t: string, a: string) => `${MTA}<${t}, ${a}>`;

  type SuffixedArgs =
    | [string, string, string] // typeName, fieldName, suffix
    | [string, string]; // typeName, suffix

  const suffixed = (...args: SuffixedArgs) => {
    let nameStr = "";
    if (args.length === 3) {
      const [typeName, fieldName, suffix] = args;
      const pascalField = pascalCase(fieldName);
      if (metadata.hasField(schema, typeName, pascalField)) {
        nameStr = `${typeName}${fieldName}${suffix}`;
      } else {
        nameStr = `${typeName}${pascalField}${suffix}`;
      }
    } else {
      nameStr = `${args[0]}${args[1]}`;
    }
    return metadata.safeTypeName(schema, nameStr);
  };

  const argFieldName = (typeName: string, fieldName: string) =>
    suffixed(typeName, fieldName, "Args");
  const fieldReturnTypeName = (typeName: string, fieldName: string) =>
    suffixed(typeName, fieldName, "ReturnType");
  const typeReturnTypeName = (
    type: GraphQLObjectType | GraphQLInterfaceType | GraphQLUnionType
  ) => {
    if (isUnionType(type)) {
      return suffixed(type.name, "ReturnType");
    }
    if (!hasField(type, "ReturnType")) {
      return suffixed(type.name, "_ReturnType");
    }
    return suffixed(type.name, "ReturnType");
  };
  const typeRootTypeName = (typeName: string) => {
    if (isEntryType(typeName)) {
      return "{}";
    }
    return suffixed(typeName, "RootType");
  };
  const fieldResolverName = (typeName: string, fieldName: string) =>
    suffixed(typeName, fieldName, "Resolver");

  // Takes a type and turns it into a "return type", based
  // on nullability and whether it's a list.
  const getReturnType = (fieldType: GraphQLOutputType): string => {
    let { type, typeStr } = unwrapNull(fieldType);
    if (isListType(type)) {
      return `${typeStr}${maybePromiseList(getReturnType(type.ofType))}`;
    }
    if (isObjectType(type) || isInterfaceType(type) || isUnionType(type)) {
      typeStr += typeReturnTypeName(type);
    } else if (isEnumType(type)) {
      typeStr += type.name;
    } else if (isScalarType(type)) {
      typeStr += backingTypeMap[type.name] || "unknown";
    }
    return typeStr;
  };

  const printInputType = (fieldType: GraphQLInputType): string => {
    let { type, typeStr } = unwrapNull(fieldType);
    if (isListType(type)) {
      const inputTypeStr = printInputType(type.ofType);
      return inputTypeStr.indexOf("null ") !== -1
        ? `${typeStr}Array<${inputTypeStr}>`
        : `${typeStr}${inputTypeStr}[]`;
    }
    if (isInputObjectType(type) || isEnumType(type)) {
      return `${typeStr}${type.name}`;
    }
    if (isScalarType(type)) {
      return `${typeStr}${backingTypeMap[type.name] || "unknown"}`;
    }
    throw new Error(`Unexpected type ${type}`);
  };

  const printArgOrFieldMember = ({
    name,
    type,
  }: GraphQLArgument | GraphQLInputField): string => {
    if (isNonNullType(type)) {
      return `  ${name}: ${printInputType(type)};`;
    }
    return `  ${name}?: ${printInputType(type)};`;
  };

  const makeFieldArgs = (
    argTypeName: string,
    field: GraphQLField<any, any>
  ) => {
    allTypeStrings.push(
      [
        `export interface ${argTypeName} {`,
        map(field.args, (arg) => printArgOrFieldMember(arg)),
        "}",
      ].join("\n")
    );
  };

  const processField = (
    type: GraphQLObjectType | GraphQLInterfaceType,
    field: GraphQLField<any, any>
  ) => {
    const returnTypeName = fieldReturnTypeName(type.name, field.name);
    arrPush(returnTypeFields, type.name, [field.name, returnTypeName]);
    allTypeStrings.push(
      `export type ${returnTypeName} = ${getReturnType(field.type)};`
    );
    if (field.args.length) {
      const argTypeName = argFieldName(type.name, field.name);
      arrPush(argTypeFields, type.name, [field.name, argTypeName]);
      if (isObjectType(type)) {
        const interfaces = type
          .getInterfaces()
          .filter((i) => i.getFields()[field.name])
          .map((i) => argFieldName(i.name, field.name));
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
  };

  const fieldRootType = (fieldType: GraphQLOutputType): string => {
    let { type, typeStr } = unwrapNull(fieldType);
    if (isListType(type)) {
      const toWrap = fieldRootType(type.ofType);
      return toWrap.indexOf("null | ") === 0
        ? `${typeStr}Array<${toWrap}>`
        : `${typeStr}${toWrap}[]`;
    }
    if (isScalarType(type)) {
      return `${typeStr}${backingTypeMap[type.name] || "any"}`;
    }
    if (isObjectType(type)) {
      // return field.
    }
    if (isEnumType(type)) {
      return `${typeStr}${type.name}`;
    }
    return `${typeStr}any`;
  };

  const fieldBackingName = (
    type: GraphQLObjectType,
    field: GraphQLField<any, any>
  ) => {
    const colon = metadata.hasDefaultValue(type, field.name)
      ? "?:"
      : isNonNullType(field.type)
      ? ":"
      : "?:";
    return `${field.name}${colon}`;
  };

  const makeRootType = (type: GraphQLObjectType) => {
    if (isEntryType(type.name)) {
      return;
    }
    if (backingTypeMap[type.name]) {
      allTypeStrings.push(
        `export type ${typeRootTypeName(type.name)} = ${
          backingTypeMap[type.name]
        };`
      );
    } else {
      const rootMembers = mapObj(type.getFields(), (f) => {
        if (metadata.hasResolver(type.name, f.name)) {
          return null;
        }
        return `  ${fieldBackingName(type, f)} ${fieldRootType(f.type)};`;
      }).filter((f) => f);
      if (rootMembers.length === 0) {
        allTypeStrings.push(`export type ${typeRootTypeName(type.name)} = {};`);
      } else {
        allTypeStrings.push(
          [
            `export interface ${typeRootTypeName(type.name)} {`,
            rootMembers.join("\n"),
            `}`,
          ].join("\n")
        );
      }
    }
  };

  // If we have a resolver, by default we assume we don't need to
  // return something (e.g. Query type) - specify the root type if this
  // is not the case.
  const makeReturnType = (type: GraphQLObjectType) => {
    if (backingTypeMap[type.name]) {
      allTypeStrings.push(
        `export type ${typeReturnTypeName(type)} = ${backingTypeMap[type.name]}`
      );
    } else {
      const returnMembers = mapObj(type.getFields(), (f) => {
        const hasArgs = f.args.length > 0;
        if (metadata.hasResolver(type.name, f.name)) {
          return null;
        }
        const rootType = fieldRootType(f.type);
        return `  ${fieldBackingName(type, f)} ${
          hasArgs
            ? maybeThunkWithArgs(
                maybePromise(rootType),
                argFieldName(type.name, f.name)
              )
            : maybeThunk(maybePromise(rootType))
        };`;
      }).filter((f) => f);
      if (returnMembers.length === 0) {
        allTypeStrings.push(`export type ${typeReturnTypeName(type)} = {};`);
      } else {
        allTypeStrings.push(
          [
            `export type ${typeReturnTypeName(type)} = {`,
            returnMembers.join("\n"),
            `}`,
          ].join("\n")
        );
      }
    }
  };

  const makeResolvers = (type: GraphQLObjectType) => {
    // TODO
  };

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
        .forEach((i) => arrPush(interfaceRootTypes, i.name, type));
      makeRootType(type);
      makeReturnType(type);
      makeResolvers(type);
    } else if (isInputObjectType(type)) {
      typeNames.inputObjects.push(type.name);
      allTypeStrings.push(
        [
          `export interface ${type.name} {`,
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
        `export type ${typeRootTypeName(type.name)} = ${map(
          type.getTypes(),
          ({ name }) => typeRootTypeName(name),
          " | "
        )};`
      );
      allTypeStrings.push(
        `export type ${typeReturnTypeName(type)} = ${map(
          type.getTypes(),
          (t) => typeReturnTypeName(t),
          " | "
        )};`
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
    const i = schema.getType(interfaceName);
    if (!isInterfaceType(i)) {
      return;
    }
    if (backingTypeMap[interfaceName]) {
      allTypeStrings.push(
        `export type ${typeRootTypeName(interfaceName)} = ${
          backingTypeMap[interfaceName]
        };`
      );
      allTypeStrings.push(
        `export type ${typeReturnTypeName(i)} = ${
          backingTypeMap[interfaceName]
        };`
      );
    } else {
      allTypeStrings.push(
        `export type ${typeRootTypeName(interfaceName)} = ${members
          .map(({ name }) => typeRootTypeName(name))
          .join(" | ")};`
      );
      allTypeStrings.push(
        `export type ${typeReturnTypeName(i)} = ${members
          .map((name) => typeReturnTypeName(name))
          .join(" | ")};`
      );
    }
  });

  // We're always guarenteed to have at least one of these
  const objectNames = () => {
    return [
      `{`,
      map(typeNames.objects, (n) => `    ${n}: ${typeRootTypeName(n)};`),
      "  }",
    ].join("\n");
  };

  // Each interface will always have at least one member, so the interface types
  // will just be a mapping to their members.
  const interfacesWithMembers = () => {
    if (typeNames.interfaces.length === 0) {
      return "{}";
    }
    return [
      `{`,
      map(
        typeNames.interfaces,
        (n) =>
          `    ${n}: ${
            interfaceRootTypes[n]
              ? interfaceRootTypes[n].map(stringify).join(" | ")
              : "never"
          };`
      ),
      "  }",
    ].join("\n");
  };

  const enums = () => {
    if (typeNames.enums.length === 0) {
      return "{}";
    }
    return [`{`, map(typeNames.enums, (n) => `    ${n}: ${n};`), "  }"].join(
      "\n"
    );
  };

  const unions = () => {
    if (typeNames.unions.length === 0) {
      return "{}";
    }
    return [`{`, map(typeNames.unions, (n) => `    ${n}: any;`), "  }"].join(
      "\n"
    );
  };

  const scalars = () => {
    return [`{`, map(typeNames.scalars, (n) => `    ${n}: any;`), "  }"].join(
      "\n"
    );
  };

  const inputObjects = () => {
    if (typeNames.inputObjects.length === 0) {
      return "{}";
    }
    return [
      `{`,
      map(typeNames.inputObjects, (n) => `    ${n}: ${n};`),
      "  }",
    ].join("\n");
  };

  return `${headers.join("\n")}
${imports.join("\n")}

declare global {
  interface NexusGen extends NexusGenTypes {}
}

// Maybe Promise
export type ${MP}<T> = T | PromiseLike<T>;

// Maybe Promise List
export type ${MPL}<T> = Array<${MP}<T>>;

// Maybe Thunk
export type ${MT}<T> = T | (() => T);

// Maybe Thunk, with args
export type ${MTA}<T, A> = T | ((args?: A) => T);

${allTypeStrings.join("\n\n")}

${stringifyTypeFieldMapping("NexusGenArgTypes", argTypeFields)}

export interface NexusGenRootTypes {
${map(
  typeNames.interfaces.concat(typeNames.objects),
  (name) => `  ${name}: ${typeRootTypeName(name)};`
)}
}

${stringifyTypeFieldMapping("NexusGenReturnTypes", returnTypeFields)}

export interface NexusGenTypes {
  argTypes: NexusGenArgTypes;
  backingTypes: NexusGenRootTypes;
  returnTypes: NexusGenReturnTypes;
  context: ${contextType};
  enums: ${enums()};
  objects: ${objectNames()};
  interfaces: ${interfacesWithMembers()};
  unions: ${unions()};
  scalars: ${scalars()};
  inputObjects: ${inputObjects()};
  allInputTypes: 
    | Extract<keyof NexusGenTypes['inputObjects'], string>
    | Extract<keyof NexusGenTypes['enums'], string>
    | Extract<keyof NexusGenTypes['scalars'], string>;
  allOutputTypes: 
    | Extract<keyof NexusGenTypes['objects'], string>
    | Extract<keyof NexusGenTypes['enums'], string>
    | Extract<keyof NexusGenTypes['unions'], string>
    | Extract<keyof NexusGenTypes['interfaces'], string>
    | Extract<keyof NexusGenTypes['scalars'], string>;
}

export type Gen = NexusGenTypes;
`;
}

function isEntryType(typeName: string) {
  return (
    typeName === "Query" ||
    typeName === "Mutation" ||
    typeName === "Subscription"
  );
}

const stringify = (v: any) => JSON.stringify(v);

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

  const argTypes = [`export interface ${tsInterfaceName} {`]
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

function ucFirst(str: string) {
  return str
    .slice(0, 1)
    .toUpperCase()
    .concat(str.slice(1));
}

function camelize(str: string) {
  return str.replace(/^([A-Z])|[\s-_]+(\w)/g, function(match, p1, p2, offset) {
    if (p2) {
      return p2.toUpperCase();
    }
    return p1.toLowerCase();
  });
}

function pascalCase(str: string) {
  return ucFirst(camelize(str));
}

function unwrapNull(fieldType: GraphQLOutputType | GraphQLInputType) {
  let type = fieldType;
  let typeStr = "";
  if (isNonNullType(fieldType)) {
    type = fieldType.ofType;
  } else {
    typeStr += "null | ";
  }
  return { type, typeStr };
}
