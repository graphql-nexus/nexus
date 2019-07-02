import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql";
import path from "path";
import { TypegenPrinter } from "./typegen";
import { assertAbsolutePath } from "./utils";
import { SDL_HEADER, TYPEGEN_HEADER } from "./lang";
import { typegenAutoConfig } from "./typegenAutoConfig";
import {
  typegenFormatPrettier,
  TypegenFormatFn,
} from "./typegenFormatPrettier";
import {
  BuilderConfig,
  TypegenInfo,
  NexusSchema,
  SchemaBuilder,
} from "./builder";

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 */
export class TypegenMetadata {
  protected config: BuilderConfig;
  protected typegenFile: string = "";
  protected sortedSchema: GraphQLSchema;

  constructor(
    protected builder: SchemaBuilder,
    protected nexusSchema: NexusSchema
  ) {
    this.sortedSchema = this.sortSchema(nexusSchema);
    const config = (this.config = builder.getConfig());
    if (config.outputs !== false && config.shouldGenerateArtifacts !== false) {
      if (config.outputs.typegen) {
        this.typegenFile = assertAbsolutePath(
          config.outputs.typegen,
          "outputs.typegen"
        );
      }
    }
  }

  getNexusSchema() {
    return this.nexusSchema;
  }

  getBuilder() {
    return this.builder;
  }

  getTypegenFile() {
    return this.typegenFile;
  }

  /**
   * Generates the artifacts of the build based on what we
   * know about the schema and how it was defined.
   */
  async generateArtifacts() {
    if (this.config.outputs) {
      if (this.config.outputs.schema) {
        await this.writeFile(
          "schema",
          this.generateSchemaFile(this.sortedSchema),
          this.config.outputs.schema
        );
      }
      if (this.typegenFile) {
        const value = await this.generateTypesFile();
        await this.writeFile("types", value, this.typegenFile);
      }
    }
  }

  protected sortSchema(schema: GraphQLSchema) {
    let sortedSchema = schema;
    if (typeof lexicographicSortSchema !== "undefined") {
      sortedSchema = lexicographicSortSchema(schema);
    }
    return sortedSchema;
  }

  protected async writeFile(
    type: "schema" | "types",
    output: string,
    filePath: string
  ) {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) {
      return Promise.reject(
        new Error(
          `Expected an absolute path to output the GraphQL Nexus ${type}, saw ${filePath}`
        )
      );
    }
    const fs = require("fs") as typeof import("fs");
    const util = require("util") as typeof import("util");
    const [readFile, writeFile, mkdir] = [
      util.promisify(fs.readFile),
      util.promisify(fs.writeFile),
      util.promisify(fs.mkdir),
    ];
    let formatTypegen: TypegenFormatFn | null = null;
    if (typeof this.config.formatTypegen === "function") {
      formatTypegen = this.config.formatTypegen;
    } else if (this.config.prettierConfig) {
      formatTypegen = typegenFormatPrettier(this.config.prettierConfig);
    }
    const content =
      typeof formatTypegen === "function"
        ? await formatTypegen(output, type)
        : output;
    const [toSave, existing] = await Promise.all([
      content,
      readFile(filePath, "utf8").catch(() => ""),
    ]);
    if (toSave !== existing) {
      const dirPath = path.dirname(filePath);
      try {
        await mkdir(dirPath, { recursive: true });
      } catch (e) {
        if (e.code !== "EEXIST") {
          throw e;
        }
      }
      return writeFile(filePath, toSave);
    }
  }

  /**
   * Generates the schema, adding any directives as necessary
   */
  protected generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = printSchema(schema);
    return [SDL_HEADER, printedSchema].join("\n\n");
  }

  /**
   * Generates the type definitions
   */
  protected async generateTypesFile(): Promise<string> {
    const typegenInfo = await this.getTypegenInfo();
    return new TypegenPrinter(this, typegenInfo).print();
  }

  protected async getTypegenInfo(): Promise<TypegenInfo> {
    if (this.config.typegenConfig) {
      if (this.config.typegenAutoConfig) {
        console.warn(
          `Only one of typegenConfig and typegenAutoConfig should be specified, ignoring typegenConfig`
        );
      }
      return this.config.typegenConfig(this.sortedSchema, this.typegenFile);
    }
    if (this.config.typegenAutoConfig) {
      return typegenAutoConfig(this.config.typegenAutoConfig)(
        this.sortedSchema,
        this.typegenFile
      );
    }
    return {
      headers: [TYPEGEN_HEADER],
      imports: [],
      contextType: "any",
      backingTypeMap: {},
    };
  }
}
