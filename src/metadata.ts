import {
  GraphQLNamedType,
  GraphQLSchema,
  lexicographicSortSchema,
  printSchema,
} from "graphql";
import path from "path";
import { Typegen } from "./typegen";
import { assertAbsolutePath } from "./utils";
import { SDL_HEADER, TYPEGEN_HEADER } from "./lang";
import { typegenAutoConfig } from "./typegenAutoConfig";
import { prettierFormat, FormatTypegenFn } from "./prettierFormat";
import { BuilderConfig, TypegenInfo } from "./builder";
import { InterfaceTypeDef } from "./definitions/interfaceType";
import { ScalarTypeDef } from "./definitions/scalarType";
import { ObjectTypeDef } from "./definitions/objectType";
import { OutputFieldConfig } from "./definitions/blocks";

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 *
 * - The TS type backing the GraphQL type
 * - Type default resolver
 * - Whether the field has a resolver
 * - The property name of the field
 * - If the field has a "default" value
 */
export class Metadata {
  protected completed = false;
  protected objectMeta: Record<string, ObjectTypeDef> = {};
  protected interfaceMeta: Record<string, InterfaceTypeDef> = {};
  protected objectFieldMeta: Record<
    string,
    Record<string, OutputFieldConfig>
  > = {};
  protected typeImports: string[] = [];
  protected typegenFile: string = "";

  constructor(protected config: BuilderConfig) {
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

  // Predicates:

  hasResolver(typeName: string, fieldName: string) {
    return Boolean(
      this.objectFieldMeta[typeName] &&
        this.objectFieldMeta[typeName][fieldName] &&
        this.objectFieldMeta[typeName][fieldName].resolve
    );
  }

  // Schema construction helpers:

  addScalar(config: ScalarTypeDef) {
    this.checkMutable();
  }

  addExternalType(type: GraphQLNamedType) {
    this.checkMutable();
  }

  addField(typeName: string, field: OutputFieldConfig) {
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
    let formatTypegen: FormatTypegenFn | null = null;
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
    return [SDL_HEADER, printedSchema].join("\n\n");
  }

  /**
   * Generates the type definitions
   */
  async generateTypesFile(schema: GraphQLSchema): Promise<string> {
    return new Typegen(schema, this, await this.getTypegenInfo(schema)).print();
  }

  async getTypegenInfo(schema: GraphQLSchema): Promise<TypegenInfo> {
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
      backingTypeMap: {},
    };
  }

  protected checkMutable() {
    if (this.completed) {
      throw new Error("Metadata cannot be modified after the schema is built");
    }
  }
}
