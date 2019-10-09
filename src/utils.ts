import {
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLSchema,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLEnumType,
  GraphQLScalarType,
  isObjectType,
  isInputObjectType,
  isScalarType,
  isSpecifiedScalarType,
  isUnionType,
  isInterfaceType,
  isEnumType,
  specifiedScalarTypes,
  GraphQLNamedType,
  GraphQLType,
  isWrappingType,
  isListType,
  isNonNullType,
  GraphQLFieldConfig,
} from "graphql";
import path from "path";
import { UNKNOWN_TYPE_SCALAR, BuilderConfig } from "./builder";
import { TypegenMetadataConfig } from "./typegenMetadata";
import { MissingType, withNexusSymbol, NexusTypes } from "./definitions/_types";

export const isInterfaceField = (
  type: GraphQLObjectType,
  fieldName: string
) => {
  return type.getInterfaces().some((i) => Boolean(i.getFields()[fieldName]));
};

// ----------------------------

/**
 *
 * Copied from graphql-js:
 *
 */

/**
 * Given an invalid input string and a list of valid options, returns a filtered
 * list of valid options sorted based on their similarity with the input.
 */
export function suggestionList(
  input: string = "",
  options: string[] = []
): string[] {
  var optionsByDistance = Object.create(null);
  var oLength = options.length;
  var inputThreshold = input.length / 2;

  for (var i = 0; i < oLength; i++) {
    var distance = lexicalDistance(input, options[i]);
    var threshold = Math.max(inputThreshold, options[i].length / 2, 1);

    if (distance <= threshold) {
      optionsByDistance[options[i]] = distance;
    }
  }

  return Object.keys(optionsByDistance).sort(function(a, b) {
    return optionsByDistance[a] - optionsByDistance[b];
  });
}
/**
 * Computes the lexical distance between strings A and B.
 *
 * The "distance" between two strings is given by counting the minimum number
 * of edits needed to transform string A into string B. An edit can be an
 * insertion, deletion, or substitution of a single character, or a swap of two
 * adjacent characters.
 *
 * Includes a custom alteration from Damerau-Levenshtein to treat case changes
 * as a single edit which helps identify mis-cased values with an edit distance
 * of 1.
 *
 * This distance can be useful for detecting typos in input or sorting
 */
function lexicalDistance(aStr: string, bStr: string): number {
  if (aStr === bStr) {
    return 0;
  }

  let i: number;
  let j: number;
  const d: number[][] = [];
  const a = aStr.toLowerCase();
  const b = bStr.toLowerCase();
  const aLength = a.length;
  const bLength = b.length; // Any case change counts as a single edit

  if (a === b) {
    return 1;
  }

  for (i = 0; i <= aLength; i++) {
    d[i] = [i];
  }

  for (j = 1; j <= bLength; j++) {
    d[0][j] = j;
  }

  for (i = 1; i <= aLength; i++) {
    for (j = 1; j <= bLength; j++) {
      var cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[aLength][bLength];
}

// ----------------------------

export function objValues<T>(obj: Record<string, T>): T[] {
  return Object.keys(obj).reduce((result: T[], key) => {
    result.push(obj[key]);
    return result;
  }, []);
}

export function mapObj<T, R>(
  obj: Record<string, T>,
  mapper: (val: T, key: string, index: number) => R
) {
  return Object.keys(obj).map((key, index) => mapper(obj[key], key, index));
}

export function eachObj<T>(
  obj: Record<string, T>,
  iter: (val: T, key: string, index: number) => void
) {
  Object.keys(obj).forEach((name, i) => iter(obj[name], name, i));
}

export const isObject = (obj: any): boolean =>
  obj !== null && typeof obj === "object";

export const assertAbsolutePath = (pathName: string, property: string) => {
  if (!path.isAbsolute(pathName)) {
    throw new Error(
      `Expected path for ${property} to be an absolute path, saw ${pathName}`
    );
  }
  return pathName;
};

export interface GroupedTypes {
  input: GraphQLInputObjectType[];
  interface: GraphQLInterfaceType[];
  object: GraphQLObjectType[];
  union: GraphQLUnionType[];
  enum: GraphQLEnumType[];
  scalar: Array<GraphQLScalarType & { asNexusMethod?: string }>;
}

export function groupTypes(schema: GraphQLSchema) {
  const groupedTypes: GroupedTypes = {
    input: [],
    interface: [],
    object: [],
    union: [],
    enum: [],
    scalar: Array.from(specifiedScalarTypes),
  };
  const schemaTypeMap = schema.getTypeMap();
  Object.keys(schemaTypeMap)
    .sort()
    .forEach((typeName) => {
      if (typeName.indexOf("__") === 0) {
        return;
      }
      const type = schema.getType(typeName);
      if (isObjectType(type)) {
        groupedTypes.object.push(type);
      } else if (isInputObjectType(type)) {
        groupedTypes.input.push(type);
      } else if (
        isScalarType(type) &&
        !isSpecifiedScalarType(type) &&
        !isUnknownType(type)
      ) {
        groupedTypes.scalar.push(type);
      } else if (isUnionType(type)) {
        groupedTypes.union.push(type);
      } else if (isInterfaceType(type)) {
        groupedTypes.interface.push(type);
      } else if (isEnumType(type)) {
        groupedTypes.enum.push(type);
      }
    });
  return groupedTypes;
}

export function isUnknownType(type: GraphQLNamedType) {
  return type.name === UNKNOWN_TYPE_SCALAR.name;
}

export function firstDefined<T>(...args: Array<T | undefined>): T {
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (typeof arg !== "undefined") {
      return arg;
    }
  }
  /* istanbul ignore next */
  throw new Error("At least one of the values should be defined");
}

export function isPromiseLike(value: any): value is PromiseLike<any> {
  return Boolean(value && typeof value.then === "function");
}

export function relativePathTo(
  absolutePath: string,
  outputPath: string
): string {
  const filename = path.basename(absolutePath).replace(/(\.d)?\.ts/, "");
  const relative = path.relative(
    path.dirname(outputPath),
    path.dirname(absolutePath)
  );
  if (relative.indexOf(".") !== 0) {
    return `./${path.join(relative, filename)}`;
  }
  return path.join(relative, filename);
}

export interface PrintedGenTypingImportConfig {
  module: string;
  default?: string;
  bindings?: Array<string | [string, string]>; // import { X } or import { X as Y }
}

export class PrintedGenTypingImport {
  constructor(readonly config: PrintedGenTypingImportConfig) {}
}
withNexusSymbol(PrintedGenTypingImport, NexusTypes.PrintedGenTypingImport);

export function printedGenTypingImport(config: PrintedGenTypingImportConfig) {
  return new PrintedGenTypingImport(config);
}

export interface PrintedGenTypingConfig {
  name: string;
  optional: boolean;
  type: string;
  description?: string;
  imports?: PrintedGenTypingImport[];
}

export class PrintedGenTyping {
  constructor(protected config: PrintedGenTypingConfig) {}

  get imports() {
    return this.config.imports || [];
  }

  toString() {
    let str = ``;
    if (this.config.description) {
      const descriptionLines = this.config.description
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s)
        .map((s) => ` * ${s}`)
        .join("\n");
      str = `/**\n${descriptionLines}\n */\n`;
    }
    const field = `${this.config.name}${this.config.optional ? "?" : ""}`;
    str += `${field}: ${this.config.type}`;
    return str;
  }
}
withNexusSymbol(PrintedGenTyping, NexusTypes.PrintedGenTyping);

export function printedGenTyping(config: PrintedGenTypingConfig) {
  return new PrintedGenTyping(config);
}

/**
 * Normalizes the builder config into the config we need for typegen
 *
 * @param config {BuilderConfig}
 */
export function resolveTypegenConfig(
  config: BuilderConfig
): TypegenMetadataConfig {
  const { outputs, ...rest } = config;

  if (outputs && typeof outputs === "object") {
    if (typeof outputs.schema === "string") {
      assertAbsolutePath(outputs.schema, "outputs.schema");
    }
    if (typeof outputs.typegen === "string") {
      assertAbsolutePath(outputs.typegen, "outputs.typegen");
    }
  }

  const shouldGenerateArtifacts =
    typeof config.shouldGenerateArtifacts === "boolean"
      ? config.shouldGenerateArtifacts
      : process.env.NEXUS_SHOULD_GENERATE_ARTIFACTS === "true"
      ? true
      : process.env.NEXUS_SHOULD_GENERATE_ARTIFACTS === "false"
      ? false
      : Boolean(
          !process.env.NODE_ENV || process.env.NODE_ENV === "development"
        );

  const defaultSchemaPath = path.join(process.cwd(), "schema.graphql");
  const defaultTypegenPath = path.join(
    __dirname,
    "../../@types/nexus-typegen/index.d.ts"
  );
  let finalSchemaPath: false | string = false;
  let finalTypegenPath: false | string = false;

  if (shouldGenerateArtifacts === false || outputs === false) {
    finalTypegenPath = false;
    finalSchemaPath = false;
  } else if (outputs === undefined || outputs === true) {
    finalTypegenPath = defaultTypegenPath;
    finalSchemaPath = outputs === true ? defaultSchemaPath : false;
  } else if (typeof outputs === "object") {
    if (outputs.typegen === undefined || outputs.typegen === true) {
      finalTypegenPath = defaultTypegenPath;
    } else if (typeof outputs.typegen === "string") {
      finalTypegenPath = outputs.typegen;
    }
    if (outputs.schema === undefined) {
      finalSchemaPath = false;
    } else if (outputs.schema === true) {
      finalSchemaPath = defaultSchemaPath;
    } else if (typeof outputs.schema === "string") {
      finalSchemaPath = outputs.schema;
    }
  }

  return {
    ...rest,
    shouldGenerateArtifacts,
    outputs: {
      typegen: finalTypegenPath,
      schema: finalSchemaPath,
    },
  };
}

export function unwrapType(
  type: GraphQLType
): { type: GraphQLNamedType; isNonNull: boolean; list: boolean[] } {
  let finalType = type;
  let isNonNull = false;
  const list = [];
  while (isWrappingType(finalType)) {
    while (isListType(finalType)) {
      finalType = finalType.ofType;
      if (isNonNullType(finalType)) {
        finalType = finalType.ofType;
        list.unshift(true);
      } else {
        list.unshift(false);
      }
    }
    if (isNonNullType(finalType)) {
      isNonNull = true;
      finalType = finalType.ofType;
    }
  }
  return { type: finalType, isNonNull, list };
}

// export function hasExt<T extends GraphQLNamedType>(t: T): NexusExtension<T> {}

export function getExt<
  T extends GraphQLNamedType | GraphQLSchema | GraphQLFieldConfig<any, any>
>(type: T, fallback: any = {}) {
  return type.extensions ? type.extensions.nexus || fallback : fallback;
}

export function assertNoMissingTypes(
  schema: GraphQLSchema,
  missingTypes: Record<string, MissingType>
) {
  const missingTypesNames = Object.keys(missingTypes);
  const schemaTypeMap = schema.getTypeMap();
  const schemaTypeNames = Object.keys(schemaTypeMap).filter(
    (typeName) => !isUnknownType(schemaTypeMap[typeName])
  );

  if (missingTypesNames.length > 0) {
    const errors = missingTypesNames
      .map((typeName) => {
        const { fromObject } = missingTypes[typeName];

        if (fromObject) {
          return `- Looks like you forgot to import ${typeName} in the root "types" passed to Nexus makeSchema`;
        }

        const suggestions = suggestionList(typeName, schemaTypeNames);

        let suggestionsString = "";

        if (suggestions.length > 0) {
          suggestionsString = ` or mean ${suggestions.join(", ")}`;
        }

        return `- Missing type ${typeName}, did you forget to import a type to the root query${suggestionsString}?`;
      })
      .join("\n");

    throw new Error("\n" + errors);
  }
}

export function consoleWarn(msg: string) {
  console.warn(msg);
}

export function log(msg: string) {
  console.log(`GraphQL Nexus: ${msg}`);
}
