import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql";
import path from "path";
import { Typegen } from "./typegen";
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
  NexusSchemaExtensions,
} from "./builder";

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 */
export class TypegenMetadata {
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

  /**
   * Generates the artifacts of the build based on what we
   * know about the schema and how it was defined.
   */
  async generateArtifacts(schema: NexusSchema) {
    const sortedSchema = this.sortSchema(schema);
    if (this.config.outputs) {
      if (this.config.outputs.schema) {
        await this.writeFile(
          "schema",
          this.generateSchemaFile(sortedSchema),
          this.config.outputs.schema
        );
      }
      if (this.typegenFile) {
        const value = await this.generateTypesFile(
          sortedSchema,
          schema.extensions.nexus
        );
        await this.writeFile("types", value, this.typegenFile);
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

  async writeFile(type: "schema" | "types", output: string, filePath: string) {
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
  generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = printSchema(schema);
    return [SDL_HEADER, printedSchema].join("\n\n");
  }

  /**
   * Generates the type definitions
   */
  async generateTypesFile(
    schema: GraphQLSchema,
    extensions: NexusSchemaExtensions
  ): Promise<string> {
    return new Typegen(
      schema,
      {
        ...(await this.getTypegenInfo(schema)),
        typegenFile: this.typegenFile,
      },
      extensions
    ).print();
  }

  async getTypegenInfo(schema: GraphQLSchema): Promise<TypegenInfo> {
    if (this.config.typegenConfig) {
      if (this.config.typegenAutoConfig) {
        console.warn(
          `Only one of typegenConfig and typegenAutoConfig should be specified, ignoring typegenConfig`
        );
      }
      return this.config.typegenConfig(schema, this.typegenFile);
    }
    if (this.config.typegenAutoConfig) {
      return typegenAutoConfig(this.config.typegenAutoConfig)(
        schema,
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
