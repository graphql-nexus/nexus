import path from "path";
import { Options } from "prettier";
import { GraphQLSchema, lexicographicSortSchema, printSchema } from "graphql";
import { TypegenPrinter } from "./typegen";
import { SDL_HEADER, TYPEGEN_HEADER } from "./lang";
import { typegenAutoConfig } from "./typegenAutoConfig";
import {
  BuilderConfig,
  TypegenInfo,
  NexusSchema,
  SchemaBuilder,
} from "./builder";
import { FileSystem } from "./fileSystem";

export type TypegenFormatFn = (
  content: string,
  type: "types" | "schema"
) => string | Promise<string>;

/**
 * Passed into the SchemaBuilder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the
 * generated types and/or SDL artifact, including but not limited to:
 */
export class TypegenMetadata {
  protected config: BuilderConfig;
  protected typegenFile: string = "";
  protected sortedSchema: GraphQLSchema;
  protected finalPrettierConfig?: Options;

  constructor(
    protected builder: SchemaBuilder,
    protected nexusSchema: NexusSchema
  ) {
    this.sortedSchema = lexicographicSortSchema(nexusSchema);
    const config = (this.config = builder.getConfig());
    if (config.outputs !== false && config.shouldGenerateArtifacts !== false) {
      if (config.outputs.typegen) {
        this.typegenFile = this.assertAbsolutePath(
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

  getSortedSchema() {
    return this.sortedSchema;
  }

  /**
   * Generates the type definitions
   */
  protected async generateTypesFile(): Promise<string> {
    const typegenInfo = await this.getTypegenInfo();
    return new TypegenPrinter(this, typegenInfo).print();
  }

  /**
   * Generates the artifacts of the build based on what we
   * know about the schema and how it was defined.
   */
  async generateArtifacts() {
    if (this.config.outputs) {
      if (this.config.outputs.schema) {
        await this.writeTypeFile(
          "schema",
          this.generateSchemaFile(this.sortedSchema),
          this.config.outputs.schema
        );
      }
      if (this.typegenFile) {
        const value = await this.generateTypesFile();
        await this.writeTypeFile("types", value, this.typegenFile);
      }
    }
  }

  protected async writeTypeFile(
    type: "schema" | "types",
    output: string,
    filePath: string
  ) {
    const [toSave, existing] = await Promise.all([
      this.formatTypegen(output, type),
      FileSystem.getInstance()
        .getFile(filePath)
        .catch(() => ""),
    ]);
    if (toSave !== existing) {
      return FileSystem.getInstance().replaceFile(filePath, toSave);
    }
  }

  /**
   * Generates the schema, adding any directives as necessary
   */
  protected generateSchemaFile(schema: GraphQLSchema): string {
    let printedSchema = printSchema(schema);
    return [SDL_HEADER, printedSchema].join("\n\n");
  }

  async getTypegenInfo(): Promise<TypegenInfo> {
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

  /**
   * Takes "content", which is a string representing the GraphQL schema
   * or the TypeScript types (as indicated by the "fileType"), and formats them
   * with prettier if it is installed.
   * @param content
   * @param fileType
   */
  protected async formatTypegen(content: string, fileType: "types" | "schema") {
    if (this.config.formatTypegen instanceof Function) {
      return this.config.formatTypegen(content, fileType);
    }
    if (!this.config.prettierConfig) {
      return content;
    }
    try {
      const prettierConfig = this.config.prettierConfig;
      const prettier = require("prettier") as typeof import("prettier");
      if (typeof prettierConfig === "string") {
        if (!this.finalPrettierConfig) {
          this.finalPrettierConfig = JSON.parse(
            await FileSystem.getInstance().getFile(prettierConfig)
          ) as Options;
        }
      } else {
        this.finalPrettierConfig = prettierConfig;
      }
      return prettier.format(content, {
        ...this.finalPrettierConfig,
        parser: fileType === "schema" ? "graphql" : "typescript",
      });
    } catch (e) {
      console.error(e);
    }
    return content;
  }

  protected assertAbsolutePath(pathName: string, property: string) {
    if (!path.isAbsolute(pathName)) {
      throw new Error(
        `Expected path for ${property} to be a string, saw ${pathName}`
      );
    }
    return pathName;
  }
}
