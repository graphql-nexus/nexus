import {
  DirectiveLocationEnum,
  GraphQLNamedType,
  GraphQLSchema,
  lexicographicSortSchema,
  visit,
  parse,
  printSchema,
  GraphQLObjectType,
  isInputObjectType,
  isObjectType,
  isInterfaceType,
} from "graphql";
import path from "path";
import * as Types from "./types";
import { SDL_HEADER, TYPEGEN_HEADER } from "./lang";
import { assertAbsolutePath } from "./utils";
import { buildTypeDefinitions } from "./typegen";
import { typegenAutoConfig } from "./autoConfig";
import { SCALAR_TYPES } from "./common";
import { prettierFormat } from "./prettierFormat";

export interface DirectiveUse {
  location: DirectiveLocationEnum;
  typeName: string;
  args: [];
  argName?: string;
  fieldName?: string;
}

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 *
 * - Directive usage
 * - The TS type backing the GraphQL type
 * - Type default resolver
 * - Whether the field has a resolver
 * - The property name of the field
 * - If the field has a "default" value
 */
export class Metadata {
  protected completed = false;
  protected objectMeta: Record<string, Types.ObjectTypeConfig> = {};
  protected interfaceMeta: Record<string, Types.InterfaceTypeConfig> = {};
  protected objectFieldMeta: Record<
    string,
    Record<string, Types.OutputFieldConfig>
  > = {};
  protected typeImports: string[] = [];
  protected typegenFile: string = "";

  constructor(protected config: Types.BuilderConfig) {
    if (config.outputs !== false && config.shouldGenerateArtifacts !== false) {
      if (config.outputs.typegen) {
        this.typegenFile = assertAbsolutePath(
          config.outputs.typegen,
          "outputs.typegen"
        );
      }
    }
  }

  finishConstruction() {
    this.completed = true;
  }

  /**
   * Ensure the type doesn't conflict with an existing type, prefixing
   * with a _ if it does
   */
  safeTypeName(schema: GraphQLSchema, typeName: string) {
    if (!schema.getType(typeName)) {
      return typeName;
    }
    return `_${typeName}`;
  }

  /**
   * Check for the field's existence in an object type.
   */
  hasField(
    schema: GraphQLSchema,
    typeName: string,
    fieldName: string
  ): boolean {
    const type = schema.getType(typeName);
    if (!type) {
      throw new Error(".hasField should only be called on known type names");
    }
    if (
      isInputObjectType(type) ||
      isObjectType(type) ||
      isInterfaceType(type)
    ) {
      const fields = type.getFields();
      return Boolean(fields[fieldName]);
    }
    throw new Error(
      `.hasField should only be used with GraphQL types with fields, ${type}`
    );
  }

  // Predicates:

  isExternalType(typeName: string) {
    return Boolean(this.objectMeta[typeName]);
  }

  hasResolver(typeName: string, fieldName: string) {
    if (this.isFieldModified(typeName, fieldName)) {
    }
    return Boolean(
      this.objectFieldMeta[typeName] &&
        this.objectFieldMeta[typeName][fieldName] &&
        this.objectFieldMeta[typeName][fieldName].resolve
    );
  }

  hasDefaultResolver(typeName: string) {
    return Boolean(
      this.objectMeta[typeName] && this.objectMeta[typeName].defaultResolver
    );
  }

  hasDefaultValue(type: GraphQLObjectType, fieldName: string) {
    return Boolean(
      this.objectFieldMeta[type.name] &&
        this.objectFieldMeta[type.name][fieldName] &&
        this.objectFieldMeta[type.name][fieldName].default
    );
  }

  isFieldModified(typeName: string, fieldName: string) {
    return Boolean(
      this.objectMeta[typeName] &&
        this.objectMeta[typeName].fieldModifications[fieldName]
    );
  }

  isInterfaceField(type: GraphQLObjectType, fieldName: string) {
    return Boolean(
      type.getInterfaces().forEach((i) => i.getFields()[fieldName])
    );
  }

  // Schema construction helpers:

  addScalar(config: Types.ScalarOpts) {
    this.checkMutable();
  }

  addInterfaceType(config: Types.InterfaceTypeConfig) {
    this.checkMutable();
    this.interfaceMeta[config.name] = config;
  }

  addObjectType(config: Types.ObjectTypeConfig) {
    this.checkMutable();
    this.objectMeta[config.name] = config;
  }

  addExternalType(type: GraphQLNamedType) {
    this.checkMutable();
  }

  addField(typeName: string, field: Types.FieldConfig) {
    this.checkMutable();
    this.objectFieldMeta[typeName] = this.objectFieldMeta[typeName] || {};
    this.objectFieldMeta[typeName][field.name] = field;
  }

  /**
   * Generates the artifacts of the build based on what we
   * know about the schema and how it was defined.
   */
  generateArtifacts(schema: GraphQLSchema) {
    const sortedSchema = this.sortSchema(schema);
    if (this.config.outputs) {
      if (this.config.outputs.schema) {
        this.writeFile(
          "schema",
          this.generateSchemaFile(sortedSchema),
          this.config.outputs.schema
        );
      }
      const typegen = this.config.outputs.typegen;
      if (typegen) {
        this.generateTypesFile(sortedSchema).then((value) =>
          this.writeFile("types", value, typegen)
        );
      }
    }
  }

  sortSchema(schema: GraphQLSchema) {
    let sortedSchema = schema;
    if (typeof lexicographicSortSchema !== "undefined") {
      sortedSchema = lexicographicSortSchema(schema);
    }
    return sortedSchema;
  }

  writeFile(type: "schema" | "types", output: string, filePath: string) {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) {
      return Promise.reject(
        new Error(
          `Expected an absolute path to output the GraphQL Nexus ${type}, saw ${filePath}`
        )
      );
    }
    const fs = require("fs") as typeof import("fs");
    const util = require("util") as typeof import("util");
    const [readFile, writeFile] = [
      util.promisify(fs.readFile),
      util.promisify(fs.writeFile),
    ];
    let formatTypegen: Types.Maybe<Types.FormatTypegenFn> = null;
    if (typeof this.config.formatTypegen === "function") {
      formatTypegen = this.config.formatTypegen;
    } else if (this.config.prettierConfig) {
      formatTypegen = prettierFormat(this.config.prettierConfig);
    }
    const content = Promise.resolve(
      typeof formatTypegen === "function" ? formatTypegen(output, type) : output
    );
    return Promise.all([
      content,
      readFile(filePath, "utf8").catch(() => ""),
    ]).then(([toSave, existing]) => {
      if (toSave !== existing) {
        return writeFile(filePath, toSave);
      }
    });
  }

  /**
   * Generates the schema, adding any directives as necessary
   */
  generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = printSchema(schema);
    /**
     * If there are directives defined to be used on the types,
     * we need to add these manually to the AST. Directives shouldn't
     * be too common, since we're defining the schema programatically
     * rather than by hand.
     */
    if (Object.keys({}).length > 0) {
      printedSchema = printSchema(
        visit(parse(printedSchema), {
          // TODO: Add directives
        })
      );
    }
    return [SDL_HEADER, printedSchema].join("\n\n");
  }

  /**
   * Generates the type definitions
   */
  async generateTypesFile(schema: GraphQLSchema): Promise<string> {
    return buildTypeDefinitions(schema, this);
  }

  async getTypegenInfo(schema: GraphQLSchema): Promise<Types.TypegenInfo> {
    if (this.config.typegenConfig) {
      if (this.config.typegenAutoConfig) {
        console.warn(
          `Only one of typegenConfig and typegenAutoConfig should be specified, ignoring typegenConfig`
        );
      }
      return this.config.typegenConfig(schema, this.typegenFile);
    } else if (this.config.typegenAutoConfig) {
      return typegenAutoConfig(this.config.typegenAutoConfig)(
        schema,
        this.typegenFile
      );
    }
    return {
      headers: [TYPEGEN_HEADER],
      imports: [],
      contextType: "unknown",
      backingTypeMap: {
        ...SCALAR_TYPES,
      },
    };
  }

  protected checkMutable() {
    if (this.completed) {
      throw new Error("Metadata cannot be modified after the schema is built");
    }
  }
}
