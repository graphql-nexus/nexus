import {
  assertValidName,
  defaultFieldResolver,
  getNamedType,
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLEnumValueConfigMap,
  GraphQLField,
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
  GraphQLType,
  GraphQLUnionType,
  isInputObjectType,
  isInterfaceType,
  isLeafType,
  isNamedType,
  isObjectType,
  isOutputType,
  isScalarType,
  isSchema,
  isUnionType,
  isWrappingType,
  printSchema,
} from 'graphql'
import { arg, ArgsRecord, NexusArgConfig, NexusArgDef } from './definitions/args'
import {
  InputDefinitionBlock,
  NexusInputFieldDef,
  NexusOutputFieldDef,
  OutputDefinitionBlock,
} from './definitions/definitionBlocks'
import { EnumTypeConfig } from './definitions/enumType'
import { NexusExtendInputTypeConfig, NexusExtendInputTypeDef } from './definitions/extendInputType'
import { NexusExtendTypeConfig, NexusExtendTypeDef } from './definitions/extendType'
import { NexusInputObjectTypeConfig } from './definitions/inputObjectType'
import {
  InterfaceDefinitionBlock,
  NexusInterfaceTypeConfig,
  NexusInterfaceTypeDef,
} from './definitions/interfaceType'
import {
  Implemented,
  NexusObjectTypeConfig,
  NexusObjectTypeDef,
  ObjectDefinitionBlock,
} from './definitions/objectType'
import { NexusScalarExtensions, NexusScalarTypeConfig } from './definitions/scalarType'
import { NexusUnionTypeConfig, UnionDefinitionBlock, UnionMembers } from './definitions/unionType'
import {
  AllNexusInputTypeDefs,
  AllNexusNamedTypeDefs,
  AllNexusOutputTypeDefs,
  isNexusArgDef,
  isNexusDynamicInputMethod,
  isNexusDynamicOutputMethod,
  isNexusDynamicOutputProperty,
  isNexusEnumTypeDef,
  isNexusExtendInputTypeDef,
  isNexusExtendTypeDef,
  isNexusInputObjectTypeDef,
  isNexusInterfaceTypeDef,
  isNexusNamedTypeDef,
  isNexusObjectTypeDef,
  isNexusPlugin,
  isNexusScalarTypeDef,
  isNexusUnionTypeDef,
} from './definitions/wrapping'
import {
  GraphQLPossibleInputs,
  GraphQLPossibleOutputs,
  MissingType,
  NexusGraphQLFieldConfig,
  NexusGraphQLInputObjectTypeConfig,
  NexusGraphQLInterfaceTypeConfig,
  NexusGraphQLObjectTypeConfig,
  NexusGraphQLSchema,
  NonNullConfig,
  RootTypings,
} from './definitions/_types'
import { DynamicInputMethodDef, DynamicOutputMethodDef } from './dynamicMethod'
import { DynamicOutputPropertyDef } from './dynamicProperty'
import {
  NexusFieldExtension,
  NexusInputObjectTypeExtension,
  NexusInterfaceTypeExtension,
  NexusObjectTypeExtension,
  NexusSchemaExtension,
} from './extensions'
import {
  composeMiddlewareFns,
  CreateFieldResolverInfo,
  MiddlewareFn,
  NexusPlugin,
  PluginConfig,
} from './plugin'
import { fieldAuthorizePlugin } from './plugins/fieldAuthorizePlugin'
import { TypegenAutoConfigOptions } from './typegenAutoConfig'
import { TypegenFormatFn } from './typegenFormatPrettier'
import { TypegenMetadata } from './typegenMetadata'
import { AbstractTypeResolver, AllInputTypes, GetGen } from './typegenTypeHelpers'
import { resolveTypegenConfig } from './typegenUtils'
import {
  assertNoMissingTypes,
  casesHandled,
  consoleWarn,
  eachObj,
  firstDefined,
  isObject,
  mapValues,
  objValues,
  UNKNOWN_TYPE_SCALAR,
  validateOnInstallHookResult,
} from './utils'

type NexusShapedOutput = {
  name: string
  definition: (t: ObjectDefinitionBlock<string>) => void
}

type NexusShapedInput = {
  name: string
  definition: (t: InputDefinitionBlock<string>) => void
}

const SCALARS: Record<string, GraphQLScalarType> = {
  String: GraphQLString,
  Int: GraphQLInt,
  Float: GraphQLFloat,
  ID: GraphQLID,
  Boolean: GraphQLBoolean,
}

export interface BuilderConfig {
  /**
   * Generated artifact settings. Set to false to disable all.
   * Set to true to enable all and use default paths. Leave
   * undefined for default behaviour of each artifact.
   */
  outputs?:
    | boolean
    | {
        /**
         * TypeScript declaration file generation settings. This file
         * contains types reflected off your source code. It is how
         * Nexus imbues dynamic code with static guarnatees.
         *
         * Defaults to being enabled when `process.env.NODE_ENV !== "production"`.
         * Set to true to enable and emit into default path (see below).
         * Set to false to disable. Set to a string to specify absolute path.
         *
         * The default path is node_modules/@types/nexus-typegen/index.d.ts.
         * This is chosen becuase TypeScript will pick it up without
         * any configuration needed by you. For more details about the @types
         * system refer to https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#types-typeroots-and-types
         */
        typegen?: boolean | string
        /**
         * GraphQL SDL generation settings. This file is not necessary but
         * may be nice for teams wishing to review SDL in pull-requests or
         * just generally transitioning from a schema-first workflow.
         *
         * Defaults to false (disabled). Set to true to enable and emit into
         * default path (current working directory). Set to a string to specify
         * absolute path.
         */
        schema?: boolean | string
      }
  /**
   * Whether the schema & types are generated when the server
   * starts. Default is !process.env.NODE_ENV || process.env.NODE_ENV === "development"
   */
  shouldGenerateArtifacts?: boolean
  /**
   * Automatically configure type resolution for the TypeScript
   * representations of the associated types.
   *
   * Alias for typegenConfig: typegenAutoConfig(options)
   */
  typegenAutoConfig?: TypegenAutoConfigOptions
  /**
   * A configuration function for advanced cases where
   * more control over the `TypegenInfo` is needed.
   */
  typegenConfig?: (schema: GraphQLSchema, outputPath: string) => TypegenInfo | PromiseLike<TypegenInfo>
  /**
   * Adjust the Prettier options used while running prettier over
   * the generated output.
   *
   * Can be an absolute path to a Prettier config file like
   * .prettierrc or package.json with "prettier" field, or an object
   * of Prettier options.
   *
   * If provided, you must have prettier available as an importable dep
   * in your project.
   *
   */
  prettierConfig?: string | object
  /**
   * Manually apply a formatter to the generated content before saving,
   * see the `prettierConfig` option if you want to use Prettier.
   */
  formatTypegen?: TypegenFormatFn
  /**
   * Configures the default "nonNullDefaults" for the entire schema the type.
   * Read more about how nexus handles nullability
   */
  nonNullDefaults?: NonNullConfig
  /**
   * List of plugins to apply to Nexus, with before/after hooks
   * executed first to last: before -> resolve -> after
   */
  plugins?: NexusPlugin[]
  /**
   * Provide if you wish to customize the behavior of the schema printing.
   * Otherwise, uses `printSchema` from graphql-js
   */
  customPrintSchemaFn?: typeof printSchema
}

export type SchemaConfig = BuilderConfig & {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience,
   * if it's an object we get the values, if it's an array we flatten out the
   * valid types, ignoring invalid ones.
   */
  types: any
  /**
   * Whether we should process.exit after the artifacts are generated.
   * Useful if you wish to explicitly generate the test artifacts at a certain stage in
   * a startup or build process.
   * @default false
   */
  shouldExitAfterGenerateArtifacts?: boolean
} & NexusGenPluginSchemaConfig

export interface TypegenInfo {
  /**
   * Headers attached to the generate type output
   */
  headers: string[]
  /**
   * All imports for the backing types / context
   */
  imports: string[]
  /**
   * A map of all GraphQL types and what TypeScript types they should
   * be represented by.
   */
  backingTypeMap: { [K in GetGen<'objectNames'>]?: string }
  /**
   * The type of the context for the resolvers
   */
  contextType?: string
  /**
   * The path to the @nexus/schema package.
   *
   * @default '@nexus/schema'
   *
   * @remarks
   *
   * This setting is particularly useful when @nexus/schema is being wrapped by
   * another library/framework such that @nexus/schema is not expected to be a
   * direct dependency at the application level.
   */
  nexusSchemaImportId?: string
}

export type TypeToWalk =
  | { type: 'named'; value: GraphQLNamedType }
  | { type: 'input'; value: NexusShapedInput }
  | { type: 'object'; value: NexusShapedOutput }
  | { type: 'interface'; value: NexusInterfaceTypeConfig<any> }

export type DynamicInputFields = Record<string, DynamicInputMethodDef<string> | string>

export type DynamicOutputFields = Record<string, DynamicOutputMethodDef<string> | string>

export type DynamicOutputProperties = Record<string, DynamicOutputPropertyDef<string>>

export type TypeDef =
  | GraphQLNamedType
  | AllNexusNamedTypeDefs
  | NexusExtendInputTypeDef<string>
  | NexusExtendTypeDef<string>

export type DynamicBlockDef =
  | DynamicInputMethodDef<string>
  | DynamicOutputMethodDef<string>
  | DynamicOutputPropertyDef<string>

export type NexusAcceptedTypeDef = TypeDef | DynamicBlockDef

export type PluginBuilderLens = {
  hasType: SchemaBuilder['hasType']
  addType: SchemaBuilder['addType']
  setConfigOption: SchemaBuilder['setConfigOption']
  hasConfigOption: SchemaBuilder['hasConfigOption']
  getConfigOption: SchemaBuilder['getConfigOption']
}

/**
 * Builds all of the types, properly accounts for any using "mix".
 * Since the enum types are resolved synchronously, these need to guard for
 * circular references at this step, while fields will guard for it during lazy evaluation.
 */
export class SchemaBuilder {
  /**
   * Used to check for circular references.
   */
  protected buildingTypes = new Set()
  /**
   * The "final type" map contains all types as they are built.
   */
  protected finalTypeMap: Record<string, GraphQLNamedType> = {}
  /**
   * The "defined type" map keeps track of all of the types that were
   * defined directly as `GraphQL*Type` objects, so we don't accidentally
   * overwrite any.
   */
  protected definedTypeMap: Record<string, GraphQLNamedType> = {}
  /**
   * The "pending type" map keeps track of all types that were defined w/
   * GraphQL Nexus and haven't been processed into concrete types yet.
   */
  protected pendingTypeMap: Record<string, AllNexusNamedTypeDefs> = {}
  /**
   * All "extensions" to types (adding fields on types from many locations)
   */
  protected typeExtendMap: Record<string, NexusExtendTypeConfig<string>[] | null> = {}
  /**
   * All "extensions" to input types (adding fields on types from many locations)
   */
  protected inputTypeExtendMap: Record<string, NexusExtendInputTypeConfig<string>[] | null> = {}
  /**
   * Configures the root-level nonNullDefaults defaults
   */
  protected nonNullDefaults: NonNullConfig = {}
  protected dynamicInputFields: DynamicInputFields = {}
  protected dynamicOutputFields: DynamicOutputFields = {}
  protected dynamicOutputProperties: DynamicOutputProperties = {}
  protected plugins: NexusPlugin[] = []

  /**
   * All types that need to be traversed for children types
   */
  protected typesToWalk: TypeToWalk[] = []

  /**
   * Root type mapping information annotated on the type definitions
   */
  protected rootTypings: RootTypings = {}

  /**
   * Array of missing types
   */
  protected missingTypes: Record<string, MissingType> = {}

  /**
   * Methods we are able to access to read/modify builder state from plugins
   */
  protected builderLens: PluginBuilderLens

  /**
   * Created just before types are walked, this keeps track of all of the resolvers
   */
  protected onMissingTypeFns: Exclude<PluginConfig['onMissingType'], undefined>[] = []

  /**
   * Executed just before types are walked
   */
  protected onBeforeBuildFns: Exclude<PluginConfig['onBeforeBuild'], undefined>[] = []

  /**
   * Executed as the field resolvers are included on the field
   */
  protected onCreateResolverFns: Exclude<PluginConfig['onCreateFieldResolver'], undefined>[] = []

  /**
   * Executed as the field "subscribe" fields are included on the schema
   */
  protected onCreateSubscribeFns: Exclude<PluginConfig['onCreateFieldSubscribe'], undefined>[] = []

  /**
   * Executed after the schema is constructed, for any final verification
   */
  protected onAfterBuildFns: Exclude<PluginConfig['onAfterBuild'], undefined>[] = []

  /**
   * The `schemaExtension` is created just after the types are walked,
   * but before the fields are materialized.
   */
  protected _schemaExtension?: NexusSchemaExtension

  get schemaExtension() {
    /* istanbul ignore next */
    if (!this._schemaExtension) {
      throw new Error('Cannot reference schemaExtension before it is created')
    }
    return this._schemaExtension
  }

  constructor(protected config: BuilderConfig) {
    this.nonNullDefaults = {
      input: false,
      output: false,
      ...config.nonNullDefaults,
    }
    this.plugins = config.plugins || [fieldAuthorizePlugin()]
    this.builderLens = Object.freeze({
      hasType: this.hasType,
      addType: this.addType,
      setConfigOption: this.setConfigOption,
      hasConfigOption: this.hasConfigOption,
      getConfigOption: this.getConfigOption,
    })
  }

  setConfigOption = <K extends keyof BuilderConfig>(key: K, value: BuilderConfig[K]) => {
    this.config = {
      ...this.config,
      [key]: value,
    }
  }

  hasConfigOption = (key: keyof BuilderConfig): boolean => {
    return this.config.hasOwnProperty(key)
  }

  getConfigOption = <K extends keyof BuilderConfig>(key: K): BuilderConfig[K] => {
    return this.config[key]
  }

  hasType = (typeName: string): boolean => {
    return Boolean(this.pendingTypeMap[typeName] || this.finalTypeMap[typeName])
  }

  /**
   * Add type takes a Nexus type, or a GraphQL type and pulls
   * it into an internal "type registry". It also does an initial pass
   * on any types that are referenced on the "types" field and pulls
   * those in too, so you can define types anonymously, without
   * exporting them.
   */
  addType = (typeDef: TypeDef | DynamicBlockDef) => {
    if (isNexusDynamicInputMethod(typeDef)) {
      this.dynamicInputFields[typeDef.name] = typeDef
      return
    }
    if (isNexusDynamicOutputMethod(typeDef)) {
      this.dynamicOutputFields[typeDef.name] = typeDef
      return
    }
    if (isNexusDynamicOutputProperty(typeDef)) {
      this.dynamicOutputProperties[typeDef.name] = typeDef
      return
    }

    // Don't worry about internal types.
    if (typeDef.name?.indexOf('__') === 0) {
      return
    }

    const existingType = this.definedTypeMap[typeDef.name] || this.pendingTypeMap[typeDef.name]

    if (isNexusExtendTypeDef(typeDef)) {
      const typeExtensions = (this.typeExtendMap[typeDef.name] = this.typeExtendMap[typeDef.name] || [])
      typeExtensions.push(typeDef.value)
      this.typesToWalk.push({ type: 'object', value: typeDef.value })
      return
    }

    if (isNexusExtendInputTypeDef(typeDef)) {
      const typeExtensions = (this.inputTypeExtendMap[typeDef.name] =
        this.inputTypeExtendMap[typeDef.name] || [])
      typeExtensions.push(typeDef.value)
      this.typesToWalk.push({ type: 'input', value: typeDef.value })
      return
    }

    if (existingType) {
      // Allow importing the same exact type more than once.
      if (existingType === typeDef) {
        return
      }
      throw extendError(typeDef.name)
    }

    if (isNexusScalarTypeDef(typeDef) && typeDef.value.asNexusMethod) {
      this.dynamicInputFields[typeDef.value.asNexusMethod] = typeDef.name
      this.dynamicOutputFields[typeDef.value.asNexusMethod] = typeDef.name
      if (typeDef.value.rootTyping) {
        this.rootTypings[typeDef.name] = typeDef.value.rootTyping
      }
    } else if (isScalarType(typeDef)) {
      const scalarDef = typeDef as GraphQLScalarType & {
        extensions?: NexusScalarExtensions
      }
      if (scalarDef.extensions && scalarDef.extensions.nexus) {
        const { asNexusMethod, rootTyping } = scalarDef.extensions.nexus
        if (asNexusMethod) {
          this.dynamicInputFields[asNexusMethod] = scalarDef.name
          this.dynamicOutputFields[asNexusMethod] = typeDef.name
        }
        if (rootTyping) {
          this.rootTypings[scalarDef.name] = rootTyping
        }
      }
    }

    if (isNamedType(typeDef)) {
      let finalTypeDef = typeDef
      if (isObjectType(typeDef)) {
        const config = typeDef.toConfig()
        finalTypeDef = new GraphQLObjectType({
          ...config,
          fields: () => this.rebuildNamedOutputFields(config),
          interfaces: () => config.interfaces.map((t) => this.getInterface(t.name)),
        })
      } else if (isInterfaceType(typeDef)) {
        const config = typeDef.toConfig()
        finalTypeDef = new GraphQLInterfaceType({
          ...config,
          fields: () => this.rebuildNamedOutputFields(config),
        })
      } else if (isUnionType(typeDef)) {
        const config = typeDef.toConfig()
        finalTypeDef = new GraphQLUnionType({
          ...config,
          types: () => config.types.map((t) => this.getObjectType(t.name)),
        })
      }
      this.finalTypeMap[typeDef.name] = finalTypeDef
      this.definedTypeMap[typeDef.name] = typeDef
      this.typesToWalk.push({ type: 'named', value: typeDef })
    } else {
      this.pendingTypeMap[typeDef.name] = typeDef
    }
    if (isNexusInputObjectTypeDef(typeDef)) {
      this.typesToWalk.push({ type: 'input', value: typeDef.value })
    }
    if (isNexusObjectTypeDef(typeDef)) {
      this.typesToWalk.push({ type: 'object', value: typeDef.value })
    }
    if (isNexusInterfaceTypeDef(typeDef)) {
      this.typesToWalk.push({ type: 'interface', value: typeDef.value })
    }
  }

  addTypes(types: any) {
    if (!types) {
      return
    }
    if (isSchema(types)) {
      this.addTypes(types.getTypeMap())
    }
    if (isNexusPlugin(types)) {
      if (!this.config.plugins?.includes(types)) {
        throw new Error(
          `Nexus plugin ${types.config.name} was seen in the "types" config, but should instead be provided to the "plugins" array.`
        )
      }
      return
    }
    if (
      isNexusNamedTypeDef(types) ||
      isNexusExtendTypeDef(types) ||
      isNexusExtendInputTypeDef(types) ||
      isNamedType(types) ||
      isNexusDynamicInputMethod(types) ||
      isNexusDynamicOutputMethod(types) ||
      isNexusDynamicOutputProperty(types)
    ) {
      this.addType(types)
    } else if (Array.isArray(types)) {
      types.forEach((typeDef) => this.addTypes(typeDef))
    } else if (isObject(types)) {
      Object.keys(types).forEach((key) => this.addTypes(types[key]))
    }
  }

  rebuildNamedOutputFields(
    config: ReturnType<GraphQLObjectType['toConfig'] | GraphQLInterfaceType['toConfig']>
  ) {
    const { fields, ...rest } = config
    const fieldsConfig = typeof fields === 'function' ? fields() : fields
    return mapValues(fieldsConfig, (val, key) => {
      const { resolve, type, ...fieldConfig } = val
      const finalType = this.replaceNamedType(type)
      return {
        ...fieldConfig,
        type: finalType,
        resolve: this.makeFinalResolver(
          {
            builder: this.builderLens,
            fieldConfig: {
              ...fieldConfig,
              type: finalType,
              name: key,
            },
            schemaConfig: this.config,
            parentTypeConfig: rest,
            schemaExtension: this.schemaExtension,
          },
          resolve
        ),
      }
    })
  }

  walkTypes() {
    let obj
    while ((obj = this.typesToWalk.shift())) {
      switch (obj.type) {
        case 'input':
          this.walkInputType(obj.value)
          break
        case 'interface':
          this.walkInterfaceType(obj.value)
          break
        case 'named':
          this.walkNamedTypes(obj.value)
          break
        case 'object':
          this.walkOutputType(obj.value)
          break
        default:
          casesHandled(obj)
      }
    }
  }

  beforeWalkTypes() {
    this.plugins.forEach((obj, i) => {
      if (!isNexusPlugin(obj)) {
        throw new Error(`Expected a plugin in plugins[${i}], saw ${obj}`)
      }
      const { config: pluginConfig } = obj
      if (pluginConfig.onInstall) {
        const installResult = pluginConfig.onInstall(this.builderLens)
        validateOnInstallHookResult(pluginConfig.name, installResult)
        installResult.types.forEach((t) => this.addType(t))
      }
      if (pluginConfig.onCreateFieldResolver) {
        this.onCreateResolverFns.push(pluginConfig.onCreateFieldResolver)
      }
      if (pluginConfig.onCreateFieldSubscribe) {
        this.onCreateSubscribeFns.push(pluginConfig.onCreateFieldSubscribe)
      }
      if (pluginConfig.onBeforeBuild) {
        this.onBeforeBuildFns.push(pluginConfig.onBeforeBuild)
      }
      if (pluginConfig.onMissingType) {
        this.onMissingTypeFns.push(pluginConfig.onMissingType)
      }
      if (pluginConfig.onAfterBuild) {
        this.onAfterBuildFns.push(pluginConfig.onAfterBuild)
      }
    })
  }

  beforeBuildTypes() {
    this.onBeforeBuildFns.forEach((fn) => {
      fn(this.builderLens)
      if (this.typesToWalk.length > 0) {
        this.walkTypes()
      }
    })
  }

  buildNexusTypes() {
    // If Query isn't defined, set it to null so it falls through to "missingType"
    if (!this.pendingTypeMap.Query) {
      this.pendingTypeMap.Query = null as any
    }
    Object.keys(this.pendingTypeMap).forEach((key) => {
      if (this.typesToWalk.length > 0) {
        this.walkTypes()
      }
      // If we've already constructed the type by this point,
      // via circular dependency resolution don't worry about building it.
      if (this.finalTypeMap[key]) {
        return
      }
      if (this.definedTypeMap[key]) {
        throw extendError(key)
      }
      this.finalTypeMap[key] = this.getOrBuildType(key)
      this.buildingTypes.clear()
    })
    Object.keys(this.typeExtendMap).forEach((key) => {
      // If we haven't defined the type, assume it's an object type
      if (this.typeExtendMap[key] !== null) {
        this.buildObjectType({
          name: key,
          definition() {},
        })
      }
    })
    Object.keys(this.inputTypeExtendMap).forEach((key) => {
      // If we haven't defined the type, assume it's an input object type
      if (this.inputTypeExtendMap[key] !== null) {
        this.buildInputObjectType({
          name: key,
          definition() {},
        })
      }
    })
  }

  createSchemaExtension() {
    this._schemaExtension = new NexusSchemaExtension({
      ...this.config,
      dynamicFields: {
        dynamicInputFields: this.dynamicInputFields,
        dynamicOutputFields: this.dynamicOutputFields,
        dynamicOutputProperties: this.dynamicOutputProperties,
      },
      rootTypings: this.rootTypings,
    })
  }

  getFinalTypeMap(): BuildTypes<any> {
    this.beforeWalkTypes()
    this.createSchemaExtension()
    this.walkTypes()
    this.beforeBuildTypes()
    this.buildNexusTypes()
    return {
      finalConfig: this.config,
      typeMap: this.finalTypeMap,
      schemaExtension: this.schemaExtension!,
      missingTypes: this.missingTypes,
      onAfterBuildFns: this.onAfterBuildFns,
    }
  }

  buildInputObjectType(config: NexusInputObjectTypeConfig<any>): GraphQLInputObjectType {
    const fields: NexusInputFieldDef[] = []
    const definitionBlock = new InputDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(field),
      addDynamicInputFields: (block, isList) => this.addDynamicInputFields(block, isList),
      warn: consoleWarn,
    })
    config.definition(definitionBlock)
    const extensions = this.inputTypeExtendMap[config.name]
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock)
      })
    }
    this.inputTypeExtendMap[config.name] = null
    const inputObjectTypeConfig: NexusGraphQLInputObjectTypeConfig = {
      name: config.name,
      fields: () => this.buildInputObjectFields(fields, inputObjectTypeConfig),
      description: config.description,
      extensions: {
        nexus: new NexusInputObjectTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLInputObjectType(inputObjectTypeConfig))
  }

  buildObjectType(config: NexusObjectTypeConfig<any>) {
    const fields: NexusOutputFieldDef[] = []
    const interfaces: Implemented[] = []
    const definitionBlock = new ObjectDefinitionBlock({
      typeName: config.name,
      addField: (fieldDef) => fields.push(fieldDef),
      addInterfaces: (interfaceDefs) => interfaces.push(...interfaceDefs),
      addDynamicOutputMembers: (block, isList) => this.addDynamicOutputMembers(block, isList, 'build'),
      warn: consoleWarn,
    })
    config.definition(definitionBlock)
    const extensions = this.typeExtendMap[config.name]
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock)
      })
    }
    this.typeExtendMap[config.name] = null
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping
    }
    const objectTypeConfig: NexusGraphQLObjectTypeConfig = {
      name: config.name,
      interfaces: () => interfaces.map((i) => this.getInterface(i)),
      description: config.description,
      fields: () => {
        const allInterfaces = interfaces.map((i) => this.getInterface(i))
        const interfaceConfigs = allInterfaces.map((i) => i.toConfig())
        const interfaceFieldsMap: GraphQLFieldConfigMap<any, any> = {}
        interfaceConfigs.forEach((i) => {
          Object.keys(i.fields).forEach((iFieldName) => {
            interfaceFieldsMap[iFieldName] = i.fields[iFieldName]
          })
        })
        return this.buildOutputFields(fields, objectTypeConfig, interfaceFieldsMap)
      },
      extensions: {
        nexus: new NexusObjectTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLObjectType(objectTypeConfig))
  }

  buildInterfaceType(config: NexusInterfaceTypeConfig<any>) {
    const { name, description } = config
    let resolveType: AbstractTypeResolver<string> | undefined
    const fields: NexusOutputFieldDef[] = []
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(field),
      setResolveType: (fn) => (resolveType = fn),
      addDynamicOutputMembers: (block, isList) => this.addDynamicOutputMembers(block, isList, 'build'),
      warn: consoleWarn,
    })
    config.definition(definitionBlock)
    const toExtend = this.typeExtendMap[config.name]
    if (toExtend) {
      toExtend.forEach((e) => {
        e.definition(definitionBlock)
      })
    }
    if (!resolveType) {
      resolveType = this.missingResolveType(config.name, 'interface')
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping
    }
    const interfaceTypeConfig: NexusGraphQLInterfaceTypeConfig = {
      name,
      resolveType,
      description,
      fields: () => this.buildOutputFields(fields, interfaceTypeConfig, {}),
      extensions: {
        nexus: new NexusInterfaceTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLInterfaceType(interfaceTypeConfig))
  }

  buildEnumType(config: EnumTypeConfig<any>) {
    const { members } = config
    const values: GraphQLEnumValueConfigMap = {}
    if (Array.isArray(members)) {
      members.forEach((m) => {
        if (typeof m === 'string') {
          values[m] = { value: m }
        } else {
          values[m.name] = {
            value: typeof m.value === 'undefined' ? m.name : m.value,
            deprecationReason: m.deprecation,
            description: m.description,
          }
        }
      })
    } else {
      Object.keys(members)
        // members can potentially be a TypeScript enum.
        // The compiled version of this enum will be the members object,
        // numeric enums members also get a reverse mapping from enum values to enum names.
        // In these cases we have to ensure we don't include these reverse mapping keys.
        // See: https://www.typescriptlang.org/docs/handbook/enums.html
        .filter((key) => isNaN(+key))
        .forEach((key) => {
          assertValidName(key)

          values[key] = {
            value: (members as Record<string, string | number | symbol>)[key],
          }
        })
    }
    if (!Object.keys(values).length) {
      throw new Error(`GraphQL Nexus: Enum ${config.name} must have at least one member`)
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping
    }
    return this.finalize(
      new GraphQLEnumType({
        name: config.name,
        values: values,
        description: config.description,
      })
    )
  }

  buildUnionType(config: NexusUnionTypeConfig<any>) {
    let members: UnionMembers | undefined
    let resolveType: AbstractTypeResolver<string> | undefined
    config.definition(
      new UnionDefinitionBlock({
        setResolveType: (fn) => (resolveType = fn),
        addUnionMembers: (unionMembers) => (members = unionMembers),
      })
    )
    if (!resolveType) {
      resolveType = this.missingResolveType(config.name, 'union')
    }
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping
    }
    return this.finalize(
      new GraphQLUnionType({
        name: config.name,
        resolveType,
        description: config.description,
        types: () => this.buildUnionMembers(config.name, members),
      })
    )
  }

  buildScalarType(config: NexusScalarTypeConfig<string>): GraphQLScalarType {
    if (config.rootTyping) {
      this.rootTypings[config.name] = config.rootTyping
    }
    return this.finalize(new GraphQLScalarType(config))
  }

  protected finalize<T extends GraphQLNamedType>(type: T): T {
    this.finalTypeMap[type.name] = type
    return type
  }

  protected missingType(typeName: string, fromObject: boolean = false): GraphQLNamedType {
    invariantGuard(typeName)
    if (this.onMissingTypeFns.length) {
      for (let i = 0; i < this.onMissingTypeFns.length; i++) {
        const fn = this.onMissingTypeFns[i]
        const replacementType = fn(typeName, this.builderLens)
        if (replacementType && replacementType.name) {
          this.addType(replacementType)
          return this.getOrBuildType(replacementType)
        }
      }
    }
    if (typeName === 'Query') {
      return new GraphQLObjectType({
        name: 'Query',
        fields: {
          ok: {
            type: GraphQLNonNull(GraphQLBoolean),
            resolve: () => true,
          },
        },
      })
    }

    if (!this.missingTypes[typeName]) {
      this.missingTypes[typeName] = { fromObject }
    }

    return UNKNOWN_TYPE_SCALAR
  }

  protected buildUnionMembers(unionName: string, members: UnionMembers | undefined) {
    const unionMembers: GraphQLObjectType[] = []
    /* istanbul ignore next */
    if (!members) {
      throw new Error(
        `Missing Union members for ${unionName}.` +
          `Make sure to call the t.members(...) method in the union blocks`
      )
    }
    members.forEach((member) => {
      unionMembers.push(this.getObjectType(member))
    })
    /* istanbul ignore next */
    if (!unionMembers.length) {
      throw new Error(`GraphQL Nexus: Union ${unionName} must have at least one member type`)
    }
    return unionMembers
  }

  protected buildOutputFields(
    fields: NexusOutputFieldDef[],
    typeConfig: NexusGraphQLInterfaceTypeConfig | NexusGraphQLObjectTypeConfig,
    intoObject: GraphQLFieldConfigMap<any, any>
  ) {
    fields.forEach((field) => {
      intoObject[field.name] = this.buildOutputField(field, typeConfig)
    })
    return intoObject
  }

  protected buildInputObjectFields(
    fields: NexusInputFieldDef[],
    typeConfig: NexusGraphQLInputObjectTypeConfig
  ): GraphQLInputFieldConfigMap {
    const fieldMap: GraphQLInputFieldConfigMap = {}
    fields.forEach((field) => {
      fieldMap[field.name] = this.buildInputObjectField(field, typeConfig)
    })
    return fieldMap
  }

  protected buildOutputField(
    fieldConfig: NexusOutputFieldDef,
    typeConfig: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig
  ): GraphQLFieldConfig<any, any> {
    if (!fieldConfig.type) {
      /* istanbul ignore next */
      throw new Error(`Missing required "type" field for ${typeConfig.name}.${fieldConfig.name}`)
    }
    const fieldExtension = new NexusFieldExtension(fieldConfig)
    const builderFieldConfig: Omit<NexusGraphQLFieldConfig, 'resolve' | 'subscribe'> = {
      name: fieldConfig.name,
      type: this.decorateType(
        this.getOutputType(fieldConfig.type),
        fieldConfig.list,
        this.outputNonNull(typeConfig, fieldConfig)
      ),
      args: this.buildArgs(fieldConfig.args || {}, typeConfig),
      description: fieldConfig.description,
      deprecationReason: fieldConfig.deprecation,
      extensions: {
        nexus: fieldExtension,
      },
    }
    return {
      resolve: this.makeFinalResolver(
        {
          builder: this.builderLens,
          fieldConfig: builderFieldConfig,
          parentTypeConfig: typeConfig,
          schemaConfig: this.config,
          schemaExtension: this.schemaExtension,
        },
        fieldConfig.resolve
      ),
      subscribe: fieldConfig.subscribe,
      ...builderFieldConfig,
    }
  }

  protected makeFinalResolver(info: CreateFieldResolverInfo, resolver?: GraphQLFieldResolver<any, any>) {
    const resolveFn = resolver || defaultFieldResolver
    if (this.onCreateResolverFns.length) {
      const toCompose = this.onCreateResolverFns.map((fn) => fn(info)).filter((f) => f) as MiddlewareFn[]
      if (toCompose.length) {
        return composeMiddlewareFns(toCompose, resolveFn)
      }
    }
    return resolveFn
  }

  protected buildInputObjectField(
    field: NexusInputFieldDef,
    typeConfig: NexusGraphQLInputObjectTypeConfig
  ): GraphQLInputFieldConfig {
    return {
      type: this.decorateType(
        this.getInputType(field.type),
        field.list,
        this.inputNonNull(typeConfig, field)
      ),
      defaultValue: field.default,
      description: field.description,
    }
  }

  protected buildArgs(
    args: ArgsRecord,
    typeConfig: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig
  ): GraphQLFieldConfigArgumentMap {
    const allArgs: GraphQLFieldConfigArgumentMap = {}
    Object.keys(args).forEach((argName) => {
      const argDef = normalizeArg(args[argName]).value
      allArgs[argName] = {
        type: this.decorateType(
          this.getInputType(argDef.type),
          argDef.list,
          this.inputNonNull(typeConfig, argDef)
        ),
        description: argDef.description,
        defaultValue: argDef.default,
      }
    })
    return allArgs
  }

  protected inputNonNull(
    typeDef:
      | NexusGraphQLObjectTypeConfig
      | NexusGraphQLInterfaceTypeConfig
      | NexusGraphQLInputObjectTypeConfig,
    field: NexusInputFieldDef | NexusArgConfig<any>
  ): boolean {
    const { nullable, required } = field
    const { name, nonNullDefaults = {} } = typeDef.extensions?.nexus?.config || {}
    if (typeof nullable !== 'undefined' && typeof required !== 'undefined') {
      throw new Error(`Cannot set both nullable & required on ${name}`)
    }
    if (typeof nullable !== 'undefined') {
      return !nullable
    }
    if (typeof required !== 'undefined') {
      return required
    }
    // Null by default
    return firstDefined(nonNullDefaults.input, this.nonNullDefaults.input, false)
  }

  protected outputNonNull(
    typeDef: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig,
    field: NexusOutputFieldDef
  ): boolean {
    const { nullable } = field
    const { nonNullDefaults = {} } = typeDef.extensions?.nexus?.config ?? {}
    if (typeof nullable !== 'undefined') {
      return !nullable
    }
    // Non-Null by default
    return firstDefined(nonNullDefaults.output, this.nonNullDefaults.output, true)
  }

  protected decorateType<T extends GraphQLNamedType>(
    type: T,
    list: null | undefined | true | boolean[],
    isNonNull: boolean
  ): T {
    if (list) {
      type = this.decorateList(type, list)
    }
    return (isNonNull ? GraphQLNonNull(type) : type) as T
  }

  protected decorateList<T extends GraphQLOutputType | GraphQLInputType>(type: T, list: true | boolean[]): T {
    let finalType = type
    if (!Array.isArray(list)) {
      return GraphQLList(type) as T
    }
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const isNull = !list[i]
        if (!isNull) {
          finalType = GraphQLNonNull(finalType) as T
        }
        finalType = GraphQLList(finalType) as T
      }
    }
    return finalType
  }

  protected getInterface(name: string | NexusInterfaceTypeDef<any>): GraphQLInterfaceType {
    const type = this.getOrBuildType(name)
    if (!isInterfaceType(type)) {
      /* istanbul ignore next */
      throw new Error(`Expected ${name} to be an interfaceType, saw ${type.constructor.name}`)
    }
    return type
  }

  protected getInputType(name: string | AllNexusInputTypeDefs): GraphQLPossibleInputs {
    const type = this.getOrBuildType(name)
    if (!isInputObjectType(type) && !isLeafType(type)) {
      /* istanbul ignore next */
      throw new Error(`Expected ${name} to be a possible input type, saw ${type.constructor.name}`)
    }
    return type
  }

  protected getOutputType(name: string | AllNexusOutputTypeDefs): GraphQLPossibleOutputs {
    const type = this.getOrBuildType(name)
    if (!isOutputType(type)) {
      /* istanbul ignore next */
      throw new Error(`Expected ${name} to be a valid output type, saw ${type.constructor.name}`)
    }
    return type
  }

  protected getObjectType(name: string | NexusObjectTypeDef<string>): GraphQLObjectType {
    if (isNexusNamedTypeDef(name)) {
      return this.getObjectType(name.name)
    }
    const type = this.getOrBuildType(name)
    if (!isObjectType(type)) {
      /* istanbul ignore next */
      throw new Error(`Expected ${name} to be a objectType, saw ${type.constructor.name}`)
    }
    return type
  }

  protected getOrBuildType(
    name: string | AllNexusNamedTypeDefs,
    fromObject: boolean = false
  ): GraphQLNamedType {
    invariantGuard(name)
    if (isNexusNamedTypeDef(name)) {
      return this.getOrBuildType(name.name, true)
    }
    if (SCALARS[name]) {
      return SCALARS[name]
    }
    if (this.finalTypeMap[name]) {
      return this.finalTypeMap[name]
    }
    if (this.buildingTypes.has(name)) {
      /* istanbul ignore next */
      throw new Error(
        `GraphQL Nexus: Circular dependency detected, while building types ${Array.from(this.buildingTypes)}`
      )
    }
    const pendingType = this.pendingTypeMap[name]
    if (isNexusNamedTypeDef(pendingType)) {
      this.buildingTypes.add(pendingType.name)
      if (isNexusObjectTypeDef(pendingType)) {
        return this.buildObjectType(pendingType.value)
      } else if (isNexusInterfaceTypeDef(pendingType)) {
        return this.buildInterfaceType(pendingType.value)
      } else if (isNexusEnumTypeDef(pendingType)) {
        return this.buildEnumType(pendingType.value)
      } else if (isNexusScalarTypeDef(pendingType)) {
        return this.buildScalarType(pendingType.value)
      } else if (isNexusInputObjectTypeDef(pendingType)) {
        return this.buildInputObjectType(pendingType.value)
      } else if (isNexusUnionTypeDef(pendingType)) {
        return this.buildUnionType(pendingType.value)
      } else {
        console.warn('Unknown kind of type def to build. It will be ignored. The type def was: %j', name)
      }
    }
    return this.missingType(name, fromObject)
  }

  missingResolveType(name: string, location: 'union' | 'interface') {
    console.error(
      new Error(
        `Missing resolveType for the ${name} ${location}. ` +
          `Be sure to add one in the definition block for the type, ` +
          `or t.resolveType(() => null) if you don't want or need to implement.`
      )
    )
    return (obj: any) => obj?.__typename || null
  }

  protected walkInputType<T extends NexusShapedInput>(obj: T) {
    const definitionBlock = new InputDefinitionBlock({
      typeName: obj.name,
      addField: (f) => this.maybeTraverseInputFieldType(f),
      addDynamicInputFields: (block, isList) => this.addDynamicInputFields(block, isList),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  addDynamicInputFields(block: InputDefinitionBlock<any>, isList: boolean) {
    eachObj(this.dynamicInputFields, (val, methodName) => {
      if (typeof val === 'string') {
        return this.addDynamicScalar(methodName, val, block)
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        const config = isList ? [args[0], { list: isList, ...args[1] }] : args
        return val.value.factory({
          args: config,
          typeDef: block,
          builder: this.builderLens,
          typeName: block.typeName,
        })
      }
    })
  }

  addDynamicOutputMembers(block: OutputDefinitionBlock<any>, isList: boolean, stage: 'walk' | 'build') {
    eachObj(this.dynamicOutputFields, (val, methodName) => {
      if (typeof val === 'string') {
        return this.addDynamicScalar(methodName, val, block)
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        const config = isList ? [args[0], { list: isList, ...args[1] }] : args
        return val.value.factory({
          args: config,
          typeDef: block,
          builder: this.builderLens,
          typeName: block.typeName,
          stage,
        })
      }
    })
    eachObj(this.dynamicOutputProperties, (val, propertyName) => {
      Object.defineProperty(block, propertyName, {
        get() {
          return val.value.factory({
            typeDef: block,
            builder: this.builderLens,
            typeName: block.typeName,
            stage,
          })
        },
        enumerable: true,
      })
    })
  }

  addDynamicScalar(
    methodName: string,
    typeName: string,
    block: OutputDefinitionBlock<any> | InputDefinitionBlock<any>
  ) {
    // @ts-ignore
    block[methodName] = (fieldName: string, opts: any) => {
      let fieldConfig = {
        type: typeName,
      }

      if (typeof opts === 'function') {
        // @ts-ignore
        fieldConfig.resolve = opts
      } else {
        fieldConfig = { ...fieldConfig, ...opts }
      }

      // @ts-ignore
      block.field(fieldName, fieldConfig)
    }
  }

  protected walkOutputType<T extends NexusShapedOutput>(obj: T) {
    const definitionBlock = new ObjectDefinitionBlock({
      typeName: obj.name,
      addInterfaces: (i) => {
        i.forEach((j) => {
          if (typeof j !== 'string') {
            this.addType(j)
          }
        })
      },
      addField: (f) => this.maybeTraverseOutputFieldType(f),
      addDynamicOutputMembers: (block, isList) => this.addDynamicOutputMembers(block, isList, 'walk'),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  protected walkInterfaceType(obj: NexusInterfaceTypeConfig<any>) {
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: obj.name,
      setResolveType: () => {},
      addField: (f) => this.maybeTraverseOutputFieldType(f),
      addDynamicOutputMembers: (block, isList) => this.addDynamicOutputMembers(block, isList, 'walk'),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  protected maybeTraverseOutputFieldType(type: NexusOutputFieldDef) {
    const { args, type: fieldType } = type
    if (typeof fieldType !== 'string') {
      this.addType(fieldType)
    }
    if (args) {
      eachObj(args, (val) => {
        const t = isNexusArgDef(val) ? val.value.type : val
        if (typeof t !== 'string') {
          this.addType(t)
        }
      })
    }
  }

  protected maybeTraverseInputFieldType(type: NexusInputFieldDef) {
    const { type: fieldType } = type
    if (typeof fieldType !== 'string') {
      this.addType(fieldType)
    }
  }

  protected walkNamedTypes(namedType: GraphQLNamedType) {
    if (isObjectType(namedType) || isInterfaceType(namedType)) {
      eachObj(namedType.getFields(), (val) => this.addNamedTypeOutputField(val))
    }
    if (isObjectType(namedType)) {
      namedType.getInterfaces().forEach((i) => this.addUnknownTypeInternal(i))
    }
    if (isInputObjectType(namedType)) {
      eachObj(namedType.getFields(), (val) => this.addUnknownTypeInternal(getNamedType(val.type)))
    }
    if (isUnionType(namedType)) {
      namedType.getTypes().forEach((type) => this.addUnknownTypeInternal(type))
    }
  }

  protected addUnknownTypeInternal(t: GraphQLNamedType) {
    if (!this.definedTypeMap[t.name]) {
      this.addType(t)
    }
  }

  protected addNamedTypeOutputField(obj: GraphQLField<any, any>) {
    this.addUnknownTypeInternal(getNamedType(obj.type))
    if (obj.args) {
      obj.args.forEach((val) => this.addType(getNamedType(val.type)))
    }
  }

  protected replaceNamedType(type: GraphQLType) {
    let wrappingTypes: any[] = []
    let finalType = type
    while (isWrappingType(finalType)) {
      wrappingTypes.unshift(finalType.constructor)
      finalType = finalType.ofType
    }
    if (this.finalTypeMap[finalType.name] === this.definedTypeMap[finalType.name]) {
      return type
    }
    return wrappingTypes.reduce((result, Wrapper) => {
      return new Wrapper(result)
    }, this.finalTypeMap[finalType.name])
  }
}

function extendError(name: string) {
  return new Error(`${name} was already defined and imported as a type, check the docs for extending types`)
}

export type DynamicFieldDefs = {
  dynamicInputFields: DynamicInputFields
  dynamicOutputFields: DynamicOutputFields
  dynamicOutputProperties: DynamicOutputProperties
}

export interface BuildTypes<TypeMapDefs extends Record<string, GraphQLNamedType>> {
  finalConfig: BuilderConfig
  typeMap: TypeMapDefs
  missingTypes: Record<string, MissingType>
  schemaExtension: NexusSchemaExtension
  onAfterBuildFns: SchemaBuilder['onAfterBuildFns']
}

/**
 * Builds the schema, we may return more than just the schema
 * from this one day.
 */
export function makeSchemaInternal(config: SchemaConfig) {
  const builder = new SchemaBuilder(config)
  builder.addTypes(config.types)
  const { finalConfig, typeMap, missingTypes, schemaExtension, onAfterBuildFns } = builder.getFinalTypeMap()
  const { Query, Mutation, Subscription } = typeMap

  /* istanbul ignore next */
  if (!isObjectType(Query)) {
    throw new Error(`Expected Query to be a objectType, saw ${Query.constructor.name}`)
  }
  /* istanbul ignore next */
  if (Mutation && !isObjectType(Mutation)) {
    throw new Error(`Expected Mutation to be a objectType, saw ${Mutation.constructor.name}`)
  }
  /* istanbul ignore next */
  if (Subscription && !isObjectType(Subscription)) {
    throw new Error(`Expected Subscription to be a objectType, saw ${Subscription.constructor.name}`)
  }

  const schema = new GraphQLSchema({
    query: Query,
    mutation: Mutation,
    subscription: Subscription,
    types: objValues(typeMap),
    extensions: {
      nexus: schemaExtension,
    },
  }) as NexusGraphQLSchema

  onAfterBuildFns.forEach((fn) => fn(schema))

  return { schema, missingTypes, finalConfig }
}

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined
 * by the GraphQL Nexus layer or any manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the
 * root query type.
 */
export function makeSchema(config: SchemaConfig): NexusGraphQLSchema {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  if (typegenConfig.outputs.schema || typegenConfig.outputs.typegen) {
    // Generating in the next tick allows us to use the schema
    // in the optional thunk for the typegen config
    const typegenPromise = new TypegenMetadata(typegenConfig).generateArtifacts(schema)
    if (config.shouldExitAfterGenerateArtifacts) {
      typegenPromise
        .then(() => {
          console.log(`Generated Artifacts:
          TypeScript Types  ==> ${typegenConfig.outputs.typegen || '(not enabled)'}
          GraphQL Schema    ==> ${typegenConfig.outputs.schema || '(not enabled)'}`)
          process.exit(0)
        })
        .catch((e) => {
          console.error(e)
          process.exit(1)
        })
    } else {
      typegenPromise.catch((e) => {
        console.error(e)
      })
    }
  }
  assertNoMissingTypes(schema, missingTypes)
  return schema
}

/**
 * Like makeSchema except that typegen is always run
 * and waited upon.
 */
export async function generateSchema(config: SchemaConfig): Promise<NexusGraphQLSchema> {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  assertNoMissingTypes(schema, missingTypes)
  await new TypegenMetadata(typegenConfig).generateArtifacts(schema)
  return schema
}

/**
 * Mainly useful for testing, generates the schema and returns the artifacts
 * that would have been otherwise written to the filesystem.
 */
generateSchema.withArtifacts = async (
  config: SchemaConfig,
  typeFilePath: string | false
): Promise<{
  schema: NexusGraphQLSchema
  schemaTypes: string
  tsTypes: string
}> => {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  assertNoMissingTypes(schema, missingTypes)
  const { schemaTypes, tsTypes } = await new TypegenMetadata(typegenConfig).generateArtifactContents(
    schema,
    typeFilePath
  )
  return { schema, schemaTypes, tsTypes }
}

/**
 * Assertion utility with nexus-aware feedback for users.
 */
function invariantGuard(val: any) {
  /* istanbul ignore next */
  if (Boolean(val) === false) {
    throw new Error(
      'Nexus Error: This should never happen, ' +
        'please check your code or if you think this is a bug open a GitHub issue https://github.com/prisma-labs/nexus/issues/new.'
    )
  }
}

function normalizeArg(
  argVal: NexusArgDef<AllInputTypes> | AllInputTypes | AllNexusInputTypeDefs<string>
): NexusArgDef<AllInputTypes> {
  if (isNexusArgDef(argVal)) {
    return argVal
  }
  return arg({ type: argVal } as any)
}
