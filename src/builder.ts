import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLFieldConfigMap,
  GraphQLFieldResolver,
  GraphQLFloat,
  GraphQLID,
  GraphQLInputFieldConfig,
  GraphQLInputFieldConfigMap,
  GraphQLInputObjectType,
  GraphQLInputType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNamedType,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLScalarType,
  GraphQLSchema,
  GraphQLString,
  GraphQLUnionType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isLeafType,
  isNamedType,
  isObjectType,
  isOutputType,
  isUnionType,
  isScalarType,
  defaultFieldResolver,
  assertValidName,
  getNamedType,
  GraphQLField,
} from "graphql";
import {
  NexusArgConfig,
  NexusArgDef,
  ArgsRecord,
  arg,
} from "./definitions/args";
import {
  InputDefinitionBlock,
  NexusInputFieldDef,
  NexusOutputFieldDef,
  OutputDefinitionBlock,
} from "./definitions/definitionBlocks";
import { EnumTypeConfig } from "./definitions/enumType";
import {
  NexusExtendTypeConfig,
  NexusExtendTypeDef,
} from "./definitions/extendType";
import { NexusInputObjectTypeConfig } from "./definitions/inputObjectType";
import {
  InterfaceDefinitionBlock,
  NexusInterfaceTypeConfig,
  NexusInterfaceTypeDef,
} from "./definitions/interfaceType";
import {
  FieldModificationDef,
  Implemented,
  NexusObjectTypeConfig,
  NexusObjectTypeDef,
  ObjectDefinitionBlock,
} from "./definitions/objectType";
import {
  NexusScalarTypeConfig,
  NexusScalarExtensions,
} from "./definitions/scalarType";
import {
  NexusUnionTypeConfig,
  UnionDefinitionBlock,
  UnionMembers,
} from "./definitions/unionType";
import {
  AllNexusInputTypeDefs,
  AllNexusNamedTypeDefs,
  isNexusEnumTypeDef,
  isNexusExtendTypeDef,
  isNexusInputObjectTypeDef,
  isNexusInterfaceTypeDef,
  isNexusNamedTypeDef,
  isNexusObjectTypeDef,
  isNexusScalarTypeDef,
  isNexusUnionTypeDef,
  isNexusWrappedType,
  NexusWrappedType,
  isNexusExtendInputTypeDef,
  AllNexusOutputTypeDefs,
  isNexusDynamicInputMethod,
  isNexusDynamicOutputMethod,
  isNexusArgDef,
} from "./definitions/wrapping";
import {
  GraphQLPossibleInputs,
  GraphQLPossibleOutputs,
  NonNullConfig,
  WrappedResolver,
  RootTypings,
} from "./definitions/_types";
import { TypegenAutoConfigOptions } from "./typegenAutoConfig";
import { TypegenFormatFn } from "./typegenFormatPrettier";
import { TypegenMetadata } from "./typegenMetadata";
import {
  AbstractTypeResolver,
  GetGen,
  AuthorizeResolver,
} from "./typegenTypeHelpers";
import {
  firstDefined,
  objValues,
  suggestionList,
  isObject,
  eachObj,
} from "./utils";
import {
  NexusExtendInputTypeDef,
  NexusExtendInputTypeConfig,
} from "./definitions/extendInputType";
import { DynamicInputMethodDef, DynamicOutputMethodDef } from "./dynamicMethod";

export type Maybe<T> = T | null;

type NexusShapedOutput = {
  name: string;
  definition: (t: ObjectDefinitionBlock<string>) => void;
};

type NexusShapedInput = {
  name: string;
  definition: (t: InputDefinitionBlock<string>) => void;
};

const SCALARS: Record<string, GraphQLScalarType> = {
  String: GraphQLString,
  Int: GraphQLInt,
  Float: GraphQLFloat,
  ID: GraphQLID,
  Boolean: GraphQLBoolean,
};

export interface BuilderConfig {
  /**
   * When the schema starts and `process.env.NODE_ENV !== "production"`,
   * artifact files are auto-generated containing the .graphql definitions of
   * the schema
   */
  outputs:
    | {
        /**
         * Absolute path where the GraphQL IDL file should be written
         */
        schema: string | false;
        /**
         * File path where generated types should be saved
         */
        typegen: string | false;
      }
    | false;
  /**
   * Whether the schema & types are generated when the server
   * starts. Default is !process.env.NODE_ENV || process.env.NODE_ENV === "development"
   */
  shouldGenerateArtifacts?: boolean;
  /**
   * Automatically configure type resolution for the TypeScript
   * representations of the associated types.
   *
   * Alias for typegenConfig: typegenAutoConfig(options)
   */
  typegenAutoConfig?: TypegenAutoConfigOptions;
  /**
   * A configuration function for advanced cases where
   * more control over the `TypegenInfo` is needed.
   */
  typegenConfig?: (
    schema: GraphQLSchema,
    outputPath: string
  ) => TypegenInfo | PromiseLike<TypegenInfo>;
  /**
   * Either an absolute path to a .prettierrc file, or an object
   * with relevant Prettier rules to be used on the generated output
   */
  prettierConfig?: string | object;
  /**
   * Manually apply a formatter to the generated content before saving,
   * see the `prettierConfig` option if you want to use Prettier.
   */
  formatTypegen?: TypegenFormatFn;
  /**
   * Configures the default "nonNullDefaults" for the entire schema the type.
   * Read more about how nexus handles nullability
   */
  nonNullDefaults?: NonNullConfig;
}

export interface TypegenInfo {
  /**
   * Headers attached to the generate type output
   */
  headers: string[];
  /**
   * All imports for the backing types / context
   */
  imports: string[];
  /**
   * A map of all GraphQL types and what TypeScript types they should
   * be represented by.
   */
  backingTypeMap: { [K in GetGen<"objectNames">]?: string };
  /**
   * The type of the context for the resolvers
   */
  contextType?: string;
}

export interface SchemaConfig extends BuilderConfig {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any;
}

export type TypeToWalk =
  | { type: "named"; value: GraphQLNamedType }
  | { type: "input"; value: NexusShapedInput }
  | { type: "object"; value: NexusShapedOutput }
  | { type: "interface"; value: NexusInterfaceTypeConfig<any> };

export type DynamicInputFields = Record<
  string,
  DynamicInputMethodDef<string> | string
>;

export type DynamicOutputFields = Record<
  string,
  DynamicOutputMethodDef<string> | string
>;

/**
 * Builds all of the types, properly accounts for any using "mix".
 * Since the enum types are resolved synchronously, these need to guard for
 * circular references at this step, while fields will guard for it during lazy evaluation.
 */
export class SchemaBuilder {
  /**
   * Used to check for circular references.
   */
  protected buildingTypes = new Set();
  /**
   * The "final type" map contains all types as they are built.
   */
  protected finalTypeMap: Record<string, GraphQLNamedType> = {};
  /**
   * The "defined type" map keeps track of all of the types that were
   * defined directly as `GraphQL*Type` objects, so we don't accidentally
   * overwrite any.
   */
  protected definedTypeMap: Record<string, GraphQLNamedType> = {};
  /**
   * The "pending type" map keeps track of all types that were defined w/
   * GraphQL Nexus and haven't been processed into concrete types yet.
   */
  protected pendingTypeMap: Record<string, AllNexusNamedTypeDefs> = {};
  /**
   * All "extensions" to types (adding fields on types from many locations)
   */
  protected typeExtensionMap: Record<
    string,
    NexusExtendTypeConfig<string>[] | null
  > = {};
  /**
   * All "extensions" to input types (adding fields on types from many locations)
   */
  protected inputTypeExtensionMap: Record<
    string,
    NexusExtendInputTypeConfig<string>[] | null
  > = {};
  /**
   * Configures the root-level nonNullDefaults defaults
   */
  protected nonNullDefaults: NonNullConfig = {};

  /**
   * Add dynamic input fields
   */
  protected dynamicInputFields: DynamicInputFields = {};

  /**
   * Add dynamic output fields
   */
  protected dynamicOutputFields: DynamicOutputFields = {};

  /**
   * All types that need to be traversed for children types
   */
  protected typesToWalk: TypeToWalk[] = [];

  /**
   * Root type mapping information annotated on the type definitions
   */
  protected rootTypings: RootTypings = {};

  /**
   * Whether we've called `getFinalTypeMap` or not
   */
  protected finalized: boolean = false;

  constructor(protected config: BuilderConfig) {
    this.nonNullDefaults = {
      input: false,
      output: true,
      ...config.nonNullDefaults,
    };
  }

  getConfig(): BuilderConfig {
    return this.config;
  }

  /**
   * Add type takes a Nexus type, or a GraphQL type and pulls
   * it into an internal "type registry". It also does an initial pass
   * on any types that are referenced on the "types" field and pulls
   * those in too, so you can define types anonymously, without
   * exporting them.
   *
   * @param typeDef
   */
  addType(
    typeDef:
      | AllNexusNamedTypeDefs
      | NexusExtendInputTypeDef<string>
      | NexusExtendTypeDef<string>
      | GraphQLNamedType
      | DynamicInputMethodDef<string>
      | DynamicOutputMethodDef<string>
  ) {
    if (isNexusDynamicInputMethod(typeDef)) {
      this.dynamicInputFields[typeDef.name] = typeDef;
      return;
    }
    if (isNexusDynamicOutputMethod(typeDef)) {
      this.dynamicOutputFields[typeDef.name] = typeDef;
      return;
    }

    const existingType =
      this.finalTypeMap[typeDef.name] || this.pendingTypeMap[typeDef.name];

    if (isNexusExtendTypeDef(typeDef)) {
      const typeExtensions = (this.typeExtensionMap[typeDef.name] =
        this.typeExtensionMap[typeDef.name] || []);
      typeExtensions.push(typeDef.value);
      this.typesToWalk.push({ type: "object", value: typeDef.value });
      return;
    }

    if (isNexusExtendInputTypeDef(typeDef)) {
      const typeExtensions = (this.inputTypeExtensionMap[typeDef.name] =
        this.inputTypeExtensionMap[typeDef.name] || []);
      typeExtensions.push(typeDef.value);
      this.typesToWalk.push({ type: "input", value: typeDef.value });
      return;
    }

    if (existingType) {
      // Allow importing the same exact type more than once.
      if (existingType === typeDef) {
        return;
      }
      throw extendError(typeDef.name);
    }

    if (isNexusScalarTypeDef(typeDef) && typeDef.value.asNexusMethod) {
      this.dynamicInputFields[typeDef.value.asNexusMethod] = typeDef.name;
      this.dynamicOutputFields[typeDef.value.asNexusMethod] = typeDef.name;
      if (typeDef.value.rootTyping) {
        this.rootTypings[typeDef.name] = typeDef.value.rootTyping;
      }
    } else if (isScalarType(typeDef)) {
      const scalarDef = typeDef as GraphQLScalarType & {
        extensions?: NexusScalarExtensions;
      };
      if (scalarDef.extensions && scalarDef.extensions.nexus) {
        const { asNexusMethod, rootTyping } = scalarDef.extensions.nexus;
        if (asNexusMethod) {
          this.dynamicInputFields[asNexusMethod] = scalarDef.name;
          this.dynamicOutputFields[asNexusMethod] = typeDef.name;
        }
        if (rootTyping) {
          this.rootTypings[scalarDef.name] = rootTyping;
        }
      }
    }

    if (isNamedType(typeDef)) {
      this.finalTypeMap[typeDef.name] = typeDef;
      this.definedTypeMap[typeDef.name] = typeDef;
      this.typesToWalk.push({ type: "named", value: typeDef });
    } else {
      this.pendingTypeMap[typeDef.name] = typeDef;
    }

    if (isNexusInputObjectTypeDef(typeDef)) {
      this.typesToWalk.push({ type: "input", value: typeDef.value });
    }
    if (isNexusObjectTypeDef(typeDef)) {
      this.typesToWalk.push({ type: "object", value: typeDef.value });
    }
    if (isNexusInterfaceTypeDef(typeDef)) {
      this.typesToWalk.push({ type: "interface", value: typeDef.value });
    }
  }

  walkTypes() {
    let obj;
    while ((obj = this.typesToWalk.shift())) {
      switch (obj.type) {
        case "input":
          this.walkInputType(obj.value);
          break;
        case "interface":
          this.walkInterfaceType(obj.value);
          break;
        case "named":
          this.walkNamedTypes(obj.value);
          break;
        case "object":
          this.walkOutputType(obj.value);
          break;
      }
    }
  }

  getFinalTypeMap(): BuildTypes<any> {
    this.finalized = true;
    this.walkTypes();
    // If Query isn't defined, set it to null so it falls through to "missingType"
    if (!this.pendingTypeMap.Query) {
      this.pendingTypeMap.Query = null as any;
    }
    Object.keys(this.pendingTypeMap).forEach((key) => {
      // If we've already constructed the type by this point,
      // via circular dependency resolution don't worry about building it.
      if (this.finalTypeMap[key]) {
        return;
      }
      if (this.definedTypeMap[key]) {
        throw extendError(key);
      }
      this.finalTypeMap[key] = this.getOrBuildType(key);
      this.buildingTypes.clear();
    });
    Object.keys(this.typeExtensionMap).forEach((key) => {
      // If we haven't defined the type, assume it's an object type
      if (this.typeExtensionMap[key] !== null) {
        this.buildObjectType({
          name: key,
          definition() {},
        });
      }
    });
    Object.keys(this.inputTypeExtensionMap).forEach((key) => {
      // If we haven't defined the type, assume it's an object type
      if (this.inputTypeExtensionMap[key] !== null) {
        this.buildInputObjectType({
          name: key,
          definition() {},
        });
      }
    });
    return {
      typeMap: this.finalTypeMap,
      dynamicFields: {
        dynamicInputFields: this.dynamicInputFields,
        dynamicOutputFields: this.dynamicOutputFields,
      },
      rootTypings: this.rootTypings,
    };
  }

  buildInputObjectType(
    config: NexusInputObjectTypeConfig<any>
  ): GraphQLInputObjectType {
    const fields: NexusInputFieldDef[] = [];
    const definitionBlock = new InputDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(field),
      addDynamicInputFields: (block, isList) =>
        this.addDynamicInputFields(block, isList),
    });
    config.definition(definitionBlock);
    const extensions = this.inputTypeExtensionMap[config.name];
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock);
      });
    }
    this.inputTypeExtensionMap[config.name] = null;
    return this.finalize(
      new GraphQLInputObjectType({
        name: config.name,
        fields: () => this.buildInputObjectFields(fields, config),
        description: config.description,
      })
    );
  }

  buildObjectType(config: NexusObjectTypeConfig<any>) {
    const fields: NexusOutputFieldDef[] = [];
    const interfaces: Implemented[] = [];
    const modifications: Record<
      string,
      FieldModificationDef<string, string>[]
    > = {};
    const definitionBlock = new ObjectDefinitionBlock({
      typeName: config.name,
      addField: (fieldDef) => fields.push(fieldDef),
      addInterfaces: (interfaceDefs) => interfaces.push(...interfaceDefs),
      addFieldModifications(mods) {
        modifications[mods.field] = modifications[mods.field] || [];
        modifications[mods.field].push(mods);
      },
      addDynamicOutputFields: (block, isList) =>
        this.addDynamicOutputFields(block, isList),
    });
    config.definition(definitionBlock);
    const extensions = this.typeExtensionMap[config.name];
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock);
      });
    }
    this.typeExtensionMap[config.name] = null;
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping;
    }
    return this.finalize(
      new GraphQLObjectType({
        name: config.name,
        interfaces: () => interfaces.map((i) => this.getInterface(i)),
        description: config.description,
        fields: () => {
          const allFieldsMap: GraphQLFieldConfigMap<any, any> = {};
          const allInterfaces = interfaces.map((i) => this.getInterface(i));
          allInterfaces.forEach((i) => {
            const interfaceFields = i.getFields();
            // We need to take the interface fields and reconstruct them
            // this actually simplifies things becuase if we've modified
            // the field at all it needs to happen here.
            Object.keys(interfaceFields).forEach((iFieldName) => {
              const { isDeprecated, args, ...rest } = interfaceFields[
                iFieldName
              ];
              allFieldsMap[iFieldName] = {
                ...rest,
                args: args.reduce(
                  (result: GraphQLFieldConfigArgumentMap, a) => {
                    const { name, ...argRest } = a;
                    result[name] = argRest;
                    return result;
                  },
                  {}
                ),
              };
              const mods = modifications[iFieldName];
              if (mods) {
                mods.map((mod) => {
                  if (typeof mod.description !== "undefined") {
                    allFieldsMap[iFieldName].description = mod.description;
                  }
                  if (typeof mod.resolve !== "undefined") {
                    allFieldsMap[iFieldName].resolve = mod.resolve;
                  }
                });
              }
            });
          });
          return this.buildObjectFields(fields, config, allFieldsMap);
        },
      })
    );
  }

  buildInterfaceType(config: NexusInterfaceTypeConfig<any>) {
    const { name, description } = config;
    let resolveType: AbstractTypeResolver<string> | undefined;
    const fields: NexusOutputFieldDef[] = [];
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(field),
      setResolveType: (fn) => (resolveType = fn),
      addDynamicOutputFields: (block, isList) =>
        this.addDynamicOutputFields(block, isList),
    });
    config.definition(definitionBlock);
    const extensions = this.typeExtensionMap[config.name];
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock);
      });
    }
    if (!resolveType) {
      resolveType = this.missingResolveType(config.name, "union");
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping;
    }
    return this.finalize(
      new GraphQLInterfaceType({
        name,
        fields: () => this.buildObjectFields(fields, config, {}, true),
        resolveType,
        description,
      })
    );
  }

  buildEnumType(config: EnumTypeConfig<any>) {
    const { members } = config;
    const values: GraphQLEnumValueConfigMap = {};
    if (Array.isArray(members)) {
      members.forEach((m) => {
        if (typeof m === "string") {
          values[m] = { value: m };
        } else {
          values[m.name] = {
            value: typeof m.value === "undefined" ? m.name : m.value,
            deprecationReason: m.deprecation,
            description: m.description,
          };
        }
      });
    } else {
      Object.keys(members)
        // members can potentially be a TypeScript enum.
        // The compiled version of this enum will be the members object,
        // numeric enums members also get a reverse mapping from enum values to enum names.
        // In these cases we have to ensure we don't include these reverse mapping keys.
        // See: https://www.typescriptlang.org/docs/handbook/enums.html
        .filter((key) => isNaN(+key))
        .forEach((key) => {
          assertValidName(key);

          values[key] = {
            value: (members as Record<string, string | number | symbol>)[key],
          };
        });
    }
    if (!Object.keys(values).length) {
      throw new Error(
        `GraphQL Nexus: Enum ${config.name} must have at least one member`
      );
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping;
    }
    return this.finalize(
      new GraphQLEnumType({
        name: config.name,
        values: values,
        description: config.description,
      })
    );
  }

  buildUnionType(config: NexusUnionTypeConfig<any>) {
    let members: UnionMembers | undefined;
    let resolveType: AbstractTypeResolver<string> | undefined;
    config.definition(
      new UnionDefinitionBlock({
        setResolveType: (fn) => (resolveType = fn),
        addUnionMembers: (unionMembers) => (members = unionMembers),
      })
    );
    if (!resolveType) {
      resolveType = this.missingResolveType(config.name, "union");
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping;
    }
    return this.finalize(
      new GraphQLUnionType({
        name: config.name,
        resolveType,
        description: config.description,
        types: () => this.buildUnionMembers(config.name, members),
      })
    );
  }

  buildScalarType(config: NexusScalarTypeConfig<string>): GraphQLScalarType {
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping;
    }
    return this.finalize(new GraphQLScalarType(config));
  }

  protected finalize<T extends GraphQLNamedType>(type: T): T {
    this.finalTypeMap[type.name] = type;
    return type;
  }

  protected missingType(
    typeName: string,
    fromObject: boolean = false
  ): GraphQLNamedType {
    invariantGuard(typeName);
    if (typeName === "Query") {
      return new GraphQLObjectType({
        name: "Query",
        fields: {
          ok: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: () => true,
          },
        },
      });
    }
    const suggestions = suggestionList(
      typeName,
      Object.keys(this.buildingTypes).concat(Object.keys(this.finalTypeMap))
    );
    if (fromObject) {
      throw new Error(
        `Looks like you forgot to import ${typeName} in the root "types" passed to Nexus makeSchema`
      );
    }
    let suggestionsString = "";
    if (suggestions.length > 0) {
      suggestionsString = ` or mean ${suggestions.join(", ")}`;
    }
    throw new Error(
      `Missing type ${typeName}, did you forget to import a type to the root query${suggestionsString}?`
    );
  }

  protected buildUnionMembers(
    unionName: string,
    members: UnionMembers | undefined
  ) {
    const unionMembers: GraphQLObjectType[] = [];
    if (!members) {
      throw new Error(
        `Missing Union members for ${unionName}.` +
          `Make sure to call the t.members(...) method in the union blocks`
      );
    }
    members.forEach((member) => {
      unionMembers.push(this.getObjectType(member));
    });
    if (!unionMembers.length) {
      throw new Error(
        `GraphQL Nexus: Union ${unionName} must have at least one member type`
      );
    }
    return unionMembers;
  }

  protected buildObjectFields(
    fields: NexusOutputFieldDef[],
    typeConfig: NexusObjectTypeConfig<any> | NexusInterfaceTypeConfig<any>,
    intoObject: GraphQLFieldConfigMap<any, any>,
    forInterface: boolean = false
  ): GraphQLFieldConfigMap<any, any> {
    fields.forEach((field) => {
      intoObject[field.name] = this.buildObjectField(
        field,
        typeConfig,
        forInterface
      );
    });
    return intoObject;
  }

  protected buildInputObjectFields(
    fields: NexusInputFieldDef[],
    typeConfig: NexusInputObjectTypeConfig<string>
  ): GraphQLInputFieldConfigMap {
    const fieldMap: GraphQLInputFieldConfigMap = {};
    fields.forEach((field) => {
      fieldMap[field.name] = this.buildInputObjectField(field, typeConfig);
    });
    return fieldMap;
  }

  protected buildObjectField(
    fieldConfig: NexusOutputFieldDef,
    typeConfig:
      | NexusObjectTypeConfig<string>
      | NexusInterfaceTypeConfig<string>,
    forInterface: boolean = false
  ): GraphQLFieldConfig<any, any> {
    if (!fieldConfig.type) {
      throw new Error(
        `Missing required "type" field for ${typeConfig.name}.${
          fieldConfig.name
        }`
      );
    }
    return {
      type: this.decorateType(
        this.getOutputType(fieldConfig.type),
        fieldConfig.list,
        this.outputNonNull(typeConfig, fieldConfig)
      ),
      args: this.buildArgs(fieldConfig.args || {}, typeConfig),
      resolve: this.getResolver(fieldConfig, typeConfig, forInterface),
      description: fieldConfig.description,
      deprecationReason: fieldConfig.deprecation,
      subscribe: forInterface ? undefined : this.getSubscribe(fieldConfig),
    };
  }

  protected buildInputObjectField(
    field: NexusInputFieldDef,
    typeConfig: NexusInputObjectTypeConfig<any>
  ): GraphQLInputFieldConfig {
    return {
      type: this.decorateType(
        this.getInputType(field.type),
        field.list,
        this.inputNonNull(typeConfig, field)
      ),
      defaultValue: field.default,
      description: field.description,
    };
  }

  protected buildArgs(
    args: ArgsRecord,
    typeConfig: NexusObjectTypeConfig<string> | NexusInterfaceTypeConfig<string>
  ): GraphQLFieldConfigArgumentMap {
    const allArgs: GraphQLFieldConfigArgumentMap = {};
    Object.keys(args).forEach((argName) => {
      const argDef = normalizeArg(args[argName]).value;
      allArgs[argName] = {
        type: this.decorateType(
          this.getInputType(argDef.type),
          argDef.list,
          this.inputNonNull(typeConfig, argDef)
        ),
        description: argDef.description,
        defaultValue: argDef.default,
      };
    });
    return allArgs;
  }

  protected inputNonNull(
    typeDef:
      | NexusObjectTypeConfig<any>
      | NexusInterfaceTypeConfig<any>
      | NexusInputObjectTypeConfig<any>,
    field: NexusInputFieldDef | NexusArgConfig<any>
  ): boolean {
    const { nullable, required } = field;
    const { name, nonNullDefaults = {} } = typeDef;
    if (typeof nullable !== "undefined" && typeof required !== "undefined") {
      throw new Error(`Cannot set both nullable & required on ${name}`);
    }
    if (typeof nullable !== "undefined") {
      return !nullable;
    }
    if (typeof required !== "undefined") {
      return required;
    }
    // Null by default
    return firstDefined(
      nonNullDefaults.input,
      this.nonNullDefaults.input,
      false
    );
  }

  protected outputNonNull(
    typeDef: NexusObjectTypeConfig<any> | NexusInterfaceTypeConfig<any>,
    field: NexusOutputFieldDef
  ): boolean {
    const { nullable } = field;
    const { nonNullDefaults = {} } = typeDef;
    if (typeof nullable !== "undefined") {
      return !nullable;
    }
    // Non-Null by default
    return firstDefined(
      nonNullDefaults.output,
      this.nonNullDefaults.output,
      true
    );
  }

  protected decorateType<T extends GraphQLNamedType>(
    type: T,
    list: null | undefined | true | boolean[],
    isNonNull: boolean
  ): T {
    if (list) {
      type = this.decorateList(type, list);
    }
    return (isNonNull ? GraphQLNonNull(type) : type) as T;
  }

  protected decorateList<T extends GraphQLOutputType | GraphQLInputType>(
    type: T,
    list: true | boolean[]
  ): T {
    let finalType = type;
    if (!Array.isArray(list)) {
      return GraphQLList(GraphQLNonNull(type)) as T;
    }
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const isNull = !list[i];
        if (!isNull) {
          finalType = GraphQLNonNull(finalType) as T;
        }
        finalType = GraphQLList(finalType) as T;
      }
    }
    return finalType;
  }

  protected getInterface(
    name: string | NexusInterfaceTypeDef<string>
  ): GraphQLInterfaceType {
    const type = this.getOrBuildType(name);
    if (!isInterfaceType(type)) {
      throw new Error(
        `Expected ${name} to be an interfaceType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getEnum(name: string): GraphQLEnumType {
    const type = this.getOrBuildType(name);
    if (!isEnumType(type)) {
      throw new Error(
        `Expected ${name} to be an enumType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getUnion(name: string): GraphQLUnionType {
    const type = this.getOrBuildType(name);
    if (!isUnionType(type)) {
      throw new Error(
        `Expected ${name} to be a unionType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getInputObjectType(name: string): GraphQLInputObjectType {
    const type = this.getOrBuildType(name);
    if (!isInputObjectType(type)) {
      throw new Error(
        `Expected ${name} to be a valid input type, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getInputType(
    name:
      | string
      | AllNexusInputTypeDefs
      | NexusWrappedType<AllNexusInputTypeDefs>
  ): GraphQLPossibleInputs {
    const type = this.getOrBuildType(name);
    if (!isInputObjectType(type) && !isLeafType(type)) {
      throw new Error(
        `Expected ${name} to be a possible input type, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getOutputType(
    name: string | AllNexusOutputTypeDefs | NexusWrappedType<any>
  ): GraphQLPossibleOutputs {
    const type = this.getOrBuildType(name);
    if (!isOutputType(type)) {
      throw new Error(
        `Expected ${name} to be a valid output type, saw ${
          type.constructor.name
        }`
      );
    }
    return type;
  }

  protected getObjectType(
    name: string | NexusObjectTypeDef<string>
  ): GraphQLObjectType {
    if (isNexusNamedTypeDef(name)) {
      return this.getObjectType(name.name);
    }
    const type = this.getOrBuildType(name);
    if (!isObjectType(type)) {
      throw new Error(
        `Expected ${name} to be a objectType, saw ${type.constructor.name}`
      );
    }
    return type;
  }

  protected getOrBuildType(
    name:
      | string
      | AllNexusNamedTypeDefs
      | NexusWrappedType<AllNexusNamedTypeDefs>,
    fromObject: boolean = false
  ): GraphQLNamedType {
    invariantGuard(name);
    if (isNexusNamedTypeDef(name) || isNexusWrappedType(name)) {
      return this.getOrBuildType(name.name, true);
    }
    if (SCALARS[name]) {
      return SCALARS[name];
    }
    if (this.finalTypeMap[name]) {
      return this.finalTypeMap[name];
    }
    if (this.buildingTypes.has(name)) {
      throw new Error(
        `GraphQL Nexus: Circular dependency detected, while building types ${Array.from(
          this.buildingTypes
        )}`
      );
    }
    const pendingType = this.pendingTypeMap[name];
    if (isNexusNamedTypeDef(pendingType)) {
      this.buildingTypes.add(pendingType.name);
      if (isNexusObjectTypeDef(pendingType)) {
        return this.buildObjectType(pendingType.value);
      } else if (isNexusInterfaceTypeDef(pendingType)) {
        return this.buildInterfaceType(pendingType.value);
      } else if (isNexusEnumTypeDef(pendingType)) {
        return this.buildEnumType(pendingType.value);
      } else if (isNexusScalarTypeDef(pendingType)) {
        return this.buildScalarType(pendingType.value);
      } else if (isNexusInputObjectTypeDef(pendingType)) {
        return this.buildInputObjectType(pendingType.value);
      } else if (isNexusUnionTypeDef(pendingType)) {
        return this.buildUnionType(pendingType.value);
      }
    }
    return this.missingType(name, fromObject);
  }

  protected getSubscribe(fieldConfig: NexusOutputFieldDef) {
    let subscribe: undefined | GraphQLFieldResolver<any, any>;
    if (fieldConfig.subscribe) {
      subscribe = fieldConfig.subscribe;
      if (fieldConfig.authorize) {
        subscribe = wrapAuthorize(subscribe, fieldConfig.authorize);
      }
    }
    return subscribe;
  }

  protected getResolver(
    fieldConfig: NexusOutputFieldDef,
    typeConfig: NexusObjectTypeConfig<any> | NexusInterfaceTypeConfig<any>,
    forInterface: boolean = false
  ) {
    let resolver: undefined | GraphQLFieldResolver<any, any>;
    if (fieldConfig.resolve) {
      resolver = fieldConfig.resolve;
    }
    if (!resolver && !forInterface) {
      resolver = (typeConfig as NexusObjectTypeConfig<any>).defaultResolver;
    }
    if (fieldConfig.authorize && typeConfig.name !== "Subscription") {
      resolver = wrapAuthorize(
        resolver || defaultFieldResolver,
        fieldConfig.authorize
      );
    }
    return resolver;
  }

  missingResolveType(name: string, location: "union" | "interface") {
    console.error(
      new Error(
        `Missing resolveType for the ${name} ${location}.` +
          `Be sure to add one in the definition block for the type, ` +
          `or t.resolveType(() => null) if you don't want to implement yet`
      )
    );
    return () => null;
  }

  protected walkInputType<T extends NexusShapedInput>(obj: T) {
    const definitionBlock = new InputDefinitionBlock({
      typeName: obj.name,
      addField: (f) => this.maybeTraverseInputType(f),
      addDynamicInputFields: (block, isList) =>
        this.addDynamicInputFields(block, isList),
    });
    obj.definition(definitionBlock);
    return obj;
  }

  addDynamicInputFields(block: InputDefinitionBlock<any>, isList: boolean) {
    eachObj(this.dynamicInputFields, (val, methodName) => {
      if (typeof val === "string") {
        return this.addDynamicScalar(methodName, val, block);
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        const config = isList ? [args[0], { list: isList, ...args[1] }] : args;
        return val.value.factory({
          args: config,
          typeDef: block,
          builder: this,
          typeName: block.typeName,
        });
      };
    });
  }

  addDynamicOutputFields(block: OutputDefinitionBlock<any>, isList: boolean) {
    eachObj(this.dynamicOutputFields, (val, methodName) => {
      if (typeof val === "string") {
        return this.addDynamicScalar(methodName, val, block);
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        const config = isList ? [args[0], { list: isList, ...args[1] }] : args;
        return val.value.factory({
          args: config,
          typeDef: block,
          builder: this,
          typeName: block.typeName,
        });
      };
    });
  }

  addDynamicScalar(
    methodName: string,
    typeName: string,
    block: OutputDefinitionBlock<any> | InputDefinitionBlock<any>
  ) {
    // @ts-ignore
    block[methodName] = (fieldName: string, opts: any) => {
      // @ts-ignore
      block.field(fieldName, {
        type: typeName,
        ...opts,
      });
    };
  }

  protected walkOutputType<T extends NexusShapedOutput>(obj: T) {
    const definitionBlock = new ObjectDefinitionBlock({
      typeName: obj.name,
      addFieldModifications: () => {},
      addInterfaces: () => {},
      addField: (f) => this.maybeTraverseOutputType(f),
      addDynamicOutputFields: (block, isList) =>
        this.addDynamicOutputFields(block, isList),
    });
    obj.definition(definitionBlock);
    return obj;
  }

  protected walkInterfaceType(obj: NexusInterfaceTypeConfig<any>) {
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: obj.name,
      setResolveType: () => {},
      addField: (f) => this.maybeTraverseOutputType(f),
      addDynamicOutputFields: (block, isList) =>
        this.addDynamicOutputFields(block, isList),
    });
    obj.definition(definitionBlock);
    return obj;
  }

  protected maybeTraverseOutputType(type: NexusOutputFieldDef) {
    const { args, type: fieldType } = type;
    if (typeof fieldType !== "string" && !isNexusWrappedType(fieldType)) {
      this.addType(fieldType);
    }
    if (args) {
      eachObj(args, (val) => {
        const t = isNexusArgDef(val) ? val.value.type : val;
        if (typeof t !== "string" && !isNexusWrappedType(t)) {
          this.addType(t);
        }
      });
    }
  }

  protected maybeTraverseInputType(type: NexusInputFieldDef) {
    const { type: fieldType } = type;
    if (typeof fieldType !== "string" && !isNexusWrappedType(fieldType)) {
      this.addType(fieldType);
    }
  }

  protected walkNamedTypes(namedType: GraphQLNamedType) {
    if (isObjectType(namedType)) {
      eachObj(namedType.getFields(), (val) => this.addObjectField(val));
    }
    if (isInterfaceType(namedType)) {
      eachObj(namedType.getFields(), (val) => this.addObjectField(val));
    }
    if (isInputObjectType(namedType)) {
      eachObj(namedType.getFields(), (val) =>
        this.addType(getNamedType(val.type))
      );
    }
  }

  protected addObjectField(obj: GraphQLField<any, any>) {
    this.addType(getNamedType(obj.type));
    if (obj.args) {
      obj.args.forEach((val) => this.addType(getNamedType(val.type)));
    }
  }
}

function extendError(name: string) {
  return new Error(
    `${name} was already defined and imported as a type, check the docs for extending types`
  );
}

export function wrapAuthorize(
  resolver: GraphQLFieldResolver<any, any>,
  authorize: AuthorizeResolver<string, any>
): GraphQLFieldResolver<any, any> {
  const nexusAuthWrapped: WrappedResolver = async (root, args, ctx, info) => {
    const authResult = await authorize(root, args, ctx, info);
    if (authResult === true) {
      return resolver(root, args, ctx, info);
    }
    if (authResult === false) {
      throw new Error("Not authorized");
    }
    if (authResult instanceof Error) {
      throw authResult;
    }
    const {
      fieldName,
      parentType: { name: parentTypeName },
    } = info;
    throw new Error(
      `Nexus authorize for ${parentTypeName}.${fieldName} Expected a boolean or Error, saw ${authResult}`
    );
  };
  nexusAuthWrapped.nexusWrappedResolver = resolver;
  return nexusAuthWrapped;
}

export type DynamicFieldDefs = {
  dynamicInputFields: DynamicInputFields;
  dynamicOutputFields: DynamicOutputFields;
};

export interface BuildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType>
> {
  typeMap: TypeMapDefs;
  dynamicFields: DynamicFieldDefs;
  rootTypings: RootTypings;
}

/**
 * Builds the types, normalizing the "types" passed into the schema for a
 * better developer experience. This is primarily useful for testing
 * type generation
 */
export function buildTypes<
  TypeMapDefs extends Record<string, GraphQLNamedType> = any
>(
  types: any,
  config: BuilderConfig = { outputs: false },
  schemaBuilder?: SchemaBuilder
): BuildTypes<TypeMapDefs> {
  const builder = schemaBuilder || new SchemaBuilder(config);
  addTypes(builder, types);
  return builder.getFinalTypeMap();
}

function addTypes(builder: SchemaBuilder, types: any) {
  if (!types) {
    return;
  }
  if (isNexusWrappedType(types)) {
    addTypes(builder, types.fn(builder));
    return;
  }
  if (
    isNexusNamedTypeDef(types) ||
    isNexusExtendTypeDef(types) ||
    isNexusExtendInputTypeDef(types) ||
    isNamedType(types) ||
    isNexusDynamicInputMethod(types) ||
    isNexusDynamicOutputMethod(types)
  ) {
    builder.addType(types);
  } else if (Array.isArray(types)) {
    types.forEach((typeDef) => addTypes(builder, typeDef));
  } else if (isObject(types)) {
    Object.keys(types).forEach((key) => addTypes(builder, types[key]));
  }
}

export type NexusSchemaExtensions = {
  rootTypings: RootTypings;
  dynamicFields: DynamicFieldDefs;
};

export type NexusSchema = GraphQLSchema & {
  extensions: Record<string, any> & { nexus: NexusSchemaExtensions };
};

/**
 * Builds the schema, we may return more than just the schema
 * from this one day.
 */
export function makeSchemaInternal(
  options: SchemaConfig,
  schemaBuilder?: SchemaBuilder
): { schema: NexusSchema } {
  const { typeMap, dynamicFields, rootTypings } = buildTypes(
    options.types,
    options,
    schemaBuilder
  );
  let { Query, Mutation, Subscription } = typeMap;

  if (!isObjectType(Query)) {
    throw new Error(
      `Expected Query to be a objectType, saw ${Query.constructor.name}`
    );
  }
  if (Mutation && !isObjectType(Mutation)) {
    throw new Error(
      `Expected Mutation to be a objectType, saw ${Mutation.constructor.name}`
    );
  }
  if (Subscription && !isObjectType(Subscription)) {
    throw new Error(
      `Expected Subscription to be a objectType, saw ${
        Subscription.constructor.name
      }`
    );
  }

  const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
    types: objValues(typeMap),
  }) as NexusSchema;

  // Loosely related to https://github.com/graphql/graphql-js/issues/1527#issuecomment-457828990
  schema.extensions = {
    ...schema.extensions,
    nexus: {
      rootTypings,
      dynamicFields,
    },
  };
  return { schema };
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GraphQL Nexus layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function makeSchema(options: SchemaConfig): NexusSchema {
  const { schema } = makeSchemaInternal(options);

  // Only in development envs do we want to worry about regenerating the
  // schema definition and/or generated types.
  const {
    shouldGenerateArtifacts = Boolean(
      !process.env.NODE_ENV || process.env.NODE_ENV === "development"
    ),
  } = options;

  if (shouldGenerateArtifacts) {
    // Generating in the next tick allows us to use the schema
    // in the optional thunk for the typegen config
    new TypegenMetadata(options).generateArtifacts(schema).catch((e) => {
      console.error(e);
    });
  }

  return schema;
}

function invariantGuard(val: any) {
  if (!Boolean(val)) {
    throw new Error(
      "Nexus Error: This should never happen, " +
        "please check your code or open a GitHub ticket if you believe this is an issue with Nexus"
    );
  }
}

function normalizeArg(
  argVal:
    | NexusArgDef<string>
    | GetGen<"allInputTypes", string>
    | AllNexusInputTypeDefs<string>
): NexusArgDef<string> {
  if (isNexusArgDef(argVal)) {
    return argVal;
  }
  return arg({ type: argVal });
}
