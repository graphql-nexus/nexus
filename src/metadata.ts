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
import { SDL_HEADER } from "./lang";
import { eachObj, assertAbsolutePath } from "./utils";
import { buildTypeDefinitions } from "./typegen";

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
export class GraphQLiteralMetadata {
  protected completed = false;
  protected objectMeta: Record<string, Types.ObjectTypeConfig> = {};
  protected interfaceMeta: Record<string, Types.InterfaceTypeConfig> = {};
  protected objectFieldMeta: Record<
    string,
    Record<string, Types.OutputFieldConfig>
  > = {};
  protected rootTypeMap: Types.RootTypeMap = {};
  protected rootImportMapping: Record<string, [string, string]> = {}; // Typename, Alias
  protected typeImports: string[] = [];
  protected typegenConfig: Types.TypegenConfig<any> = {};
  protected typegenFile: string = "";

  constructor(protected config: Types.Omit<Types.SchemaConfig<any>, "types">) {
    if (config.outputs !== false && config.shouldGenerateArtifacts !== false) {
      if (config.outputs.typegen) {
        this.typegenFile = assertAbsolutePath(
          config.outputs.typegen,
          "outputs.typegen"
        );
      }
      let typegenConfig = config.typegen || {};
      if (typeof typegenConfig === "function") {
        typegenConfig = typegenConfig();
      }
      this.typegenConfig = typegenConfig;
      eachObj(
        typegenConfig.rootTypes || {},
        (val, typeName) => val && this.addRootType(typeName, val)
      );
    }
  }

  getContextType() {
    return this.typegenConfig.contextType || "unknown";
  }

  getImportStrings(): string {
    const typeImports: string[] = [];
    if (this.typegenFile && this.typegenConfig && this.typegenConfig.imports) {
      eachObj(this.typegenConfig.imports, (importPath, alias) => {
        typeImports.push(
          `import * as ${alias} from ${JSON.stringify(
            `./${path
              .relative(path.dirname(this.typegenFile), importPath)
              .replace(/(\.d)?\.ts?/, "")}`
          )}`
        );
      });
    }
    return typeImports.join("\n");
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

  hasPropertyResolver(type: GraphQLObjectType, fieldName: string) {
    if (this.isInterfaceField(type, fieldName)) {
      //
    }
    return Boolean(
      this.objectFieldMeta[type.name] &&
        this.objectFieldMeta[type.name][fieldName] &&
        this.objectFieldMeta[type.name][fieldName].property
    );
  }

  hasDefaultValue(type: GraphQLObjectType, fieldName: string) {
    return Boolean(
      this.objectFieldMeta[type.name] &&
        this.objectFieldMeta[type.name][fieldName] &&
        this.objectFieldMeta[type.name][fieldName].default
    );
  }

  /**
   * Whether we have a used defined type for the "rootValue" of a type
   */
  hasRootTyping(typeName: string) {
    return Boolean(this.rootTypeMap[typeName]);
  }

  /**
   * Whether we have a dedicated typing for the scalar
   */
  hasScalarTyping(typeName: string) {
    return Boolean(this.rootTypeMap[typeName]);
  }

  getRootTyping(typeName: string) {
    return this.rootTypeMap[typeName];
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

  // Type Genreation Helpers:

  getPropertyResolver(type: GraphQLObjectType, fieldName: string) {
    return (
      this.objectFieldMeta[type.name] &&
      this.objectFieldMeta[type.name][fieldName].property
    );
  }

  // Schema construction helpers:

  addRootType(typeName: string, val: string | Types.ImportedType) {
    if (this.rootTypeMap[typeName]) {
      console.warn(
        `Root Type ${JSON.stringify(
          this.rootTypeMap[typeName]
        )} already exists for ${typeName} and is being replaced with ${JSON.stringify(
          val
        )}`
      );
    }
    this.rootTypeMap[typeName] = val;
  }

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
      if (this.config.outputs.typegen) {
        this.writeFile(
          "types",
          this.generateTypesFile(sortedSchema),
          this.config.outputs.typegen
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

  writeFile(name: string, output: string, filePath: string) {
    if (typeof filePath !== "string" || !path.isAbsolute(filePath)) {
      throw new Error(
        `Expected an absolute path to output the GraphQLiteral ${name}, saw ${filePath}`
      );
    }
    const fs = require("fs") as typeof import("fs");
    fs.writeFile(filePath, output, (err) => {
      if (err) {
        console.error(err);
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
  generateTypesFile(
    schema: GraphQLSchema,
    omitHeader: boolean = false
  ): string {
    return buildTypeDefinitions(schema, this, omitHeader);
  }

  protected checkMutable() {
    if (this.completed) {
      throw new Error("Metadata cannot be modified after the schema is built");
    }
  }
}
