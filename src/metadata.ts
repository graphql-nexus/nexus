import {
  DirectiveLocationEnum,
  GraphQLNamedType,
  GraphQLSchema,
  lexicographicSortSchema,
  visit,
  parse,
  printSchema,
  GraphQLObjectType,
} from "graphql";
import path from "path";
import * as Types from "./types";
import { SDL_HEADER } from "./lang";
import { eachObj } from "./utils";
import { buildTypeDefinitions } from "./typegen";

export interface DirectiveUse {
  location: DirectiveLocationEnum;
  typeName: string;
  args: [];
  argName?: string;
  fieldName?: string;
}

/**
 * Used in the schema builder, this keeps track of any necessary
 * field / type metadata we need to be aware of when building the schema.
 *
 * - Directive usage
 * - Type backing value
 * - Type default resolver
 * - Field property
 * - Field resolver
 * - Field defaultValue
 * - Whether the type is outside of
 */
export class GQLiteralMetadata {
  protected completed = false;
  protected objectMeta: Record<string, Types.ObjectTypeConfig> = {};
  protected interfaceMeta: Record<string, Types.InterfaceTypeConfig> = {};
  protected objectFieldMeta: Record<
    string,
    Record<string, Types.FieldConfig>
  > = {};
  protected metaTypeMap: Record<string, any> = {};
  protected rootTypeMap: Types.RootTypeMap = {};
  protected rootImportMapping: Record<string, [string, string]> = {}; // Typename, Alias

  constructor(protected config: Types.Omit<Types.SchemaConfig<any>, "types">) {
    eachObj(
      config.rootTypes || {},
      (val, typeName) => val && this.addRootType(typeName, val)
    );
  }

  finishConstruction() {
    this.completed = true;
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

  hasPropertyResolver(typeName: string, fieldName: string) {
    return Boolean(
      this.objectFieldMeta[typeName] &&
        this.objectFieldMeta[typeName][fieldName] &&
        this.objectFieldMeta[typeName][fieldName].property
    );
  }

  hasDefaultValue(typeName: string, fieldName: string) {
    return Boolean(
      this.objectFieldMeta[typeName] &&
        this.objectFieldMeta[typeName][fieldName] &&
        this.objectFieldMeta[typeName][fieldName].default
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

  getPropertyResolver(typeName: string, fieldName: string) {
    return (
      this.objectFieldMeta[typeName] &&
      this.objectFieldMeta[typeName][fieldName].property
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
    if (this.config.schemaPath) {
      this.writeFile(
        "schema",
        this.generateSchemaFile(sortedSchema),
        this.config.schemaPath
      );
    }
    if (this.config.typegenPath) {
      this.writeFile(
        "types",
        this.generateTypesFile(sortedSchema),
        this.config.typegenPath
      );
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
        `Expected an absolute path to output the GQLiteral ${name}, saw ${filePath}`
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
  generateTypesFile(schema: GraphQLSchema): string {
    return buildTypeDefinitions(schema, this);
  }

  protected checkMutable() {
    if (this.completed) {
      throw new Error("Metadata cannot be modified after the schema is built");
    }
  }
}
