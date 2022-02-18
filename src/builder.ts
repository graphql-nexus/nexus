import {
  assertValidName,
  defaultFieldResolver,
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
  GraphQLSchemaConfig,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  isInputObjectType,
  isInputType,
  isInterfaceType,
  isLeafType,
  isNamedType,
  isObjectType,
  isOutputType,
  isSchema,
  isWrappingType,
  printSchema,
} from 'graphql'
import type { ArgsRecord, NexusFinalArgConfig } from './definitions/args'
import {
  InputDefinitionBlock,
  NexusInputFieldDef,
  NexusOutputFieldConfig,
  NexusOutputFieldDef,
  OutputDefinitionBlock,
} from './definitions/definitionBlocks'
import type { NexusEnumTypeConfig } from './definitions/enumType'
import type { NexusExtendInputTypeConfig, NexusExtendInputTypeDef } from './definitions/extendInputType'
import type { NexusExtendTypeConfig, NexusExtendTypeDef } from './definitions/extendType'
import type { NexusInputObjectTypeConfig } from './definitions/inputObjectType'
import {
  FieldModificationDef,
  Implemented,
  InterfaceDefinitionBlock,
  NexusInterfaceTypeConfig,
  NexusInterfaceTypeDef,
} from './definitions/interfaceType'
import { NexusObjectTypeConfig, NexusObjectTypeDef, ObjectDefinitionBlock } from './definitions/objectType'
import type { NexusScalarTypeConfig } from './definitions/scalarType'
import { NexusUnionTypeConfig, UnionDefinitionBlock, UnionMembers } from './definitions/unionType'
import {
  AllNexusArgsDefs,
  AllNexusNamedInputTypeDefs,
  AllNexusNamedOutputTypeDefs,
  AllNexusNamedTypeDefs,
  AllNexusOutputTypeDefs,
  finalizeWrapping,
  isNexusDynamicInputMethod,
  isNexusDynamicOutputMethod,
  isNexusDynamicOutputProperty,
  isNexusEnumTypeDef,
  isNexusExtendInputTypeDef,
  isNexusExtendTypeDef,
  isNexusInputObjectTypeDef,
  isNexusInterfaceTypeDef,
  isNexusNamedInputTypeDef,
  isNexusNamedOuputTypeDef,
  isNexusNamedTypeDef,
  isNexusObjectTypeDef,
  isNexusPlugin,
  isNexusScalarTypeDef,
  isNexusUnionTypeDef,
  isNexusWrappingType,
  NexusFinalWrapKind,
  NexusWrapKind,
  normalizeArgWrapping,
  rewrapAsGraphQLType,
  unwrapGraphQLDef,
  unwrapNexusDef,
} from './definitions/wrapping'
import type {
  MissingType,
  NexusFeaturesInput,
  NexusGraphQLFieldConfig,
  NexusGraphQLInputObjectTypeConfig,
  NexusGraphQLInterfaceTypeConfig,
  NexusGraphQLObjectTypeConfig,
  NexusGraphQLSchema,
  NonNullConfig,
  SourceTypings,
  TypingImport,
} from './definitions/_types'
import type { DynamicInputMethodDef, DynamicOutputMethodDef } from './dynamicMethod'
import type { DynamicOutputPropertyDef } from './dynamicProperty'
import {
  hasNexusExtension,
  NexusFieldExtension,
  NexusInputObjectTypeExtension,
  NexusInterfaceTypeExtension,
  NexusObjectTypeExtension,
  NexusSchemaExtension,
} from './extensions'
import { messages } from './messages'
import {
  composeMiddlewareFns,
  CreateFieldResolverInfo,
  MiddlewareFn,
  NexusPlugin,
  PluginConfig,
} from './plugin'
import { declarativeWrappingPlugin } from './plugins'
import { fieldAuthorizePlugin } from './plugins/fieldAuthorizePlugin'
import type { SourceTypesConfigOptions } from './typegenAutoConfig'
import type { TypegenFormatFn } from './typegenFormatPrettier'
import type { AbstractTypeResolver, GetGen } from './typegenTypeHelpers'
import type { RequiredDeeply } from './typeHelpersInternal'
import {
  casesHandled,
  consoleWarn,
  eachObj,
  getArgNamedType,
  getNexusNamedType,
  graphql15InterfaceType,
  invariantGuard,
  isArray,
  isObject,
  objValues,
  UNKNOWN_TYPE_SCALAR,
} from './utils'
import {
  NEXUS_BUILD,
  isNexusMetaBuild,
  isNexusMeta,
  isNexusMetaType,
  NexusMeta,
  resolveNexusMetaType,
} from './definitions/nexusMeta'
import { rebuildNamedType, RebuildConfig } from './rebuildType'

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

type PossibleOutputType =
  | string
  | AllNexusNamedOutputTypeDefs
  | Exclude<GraphQLOutputType, GraphQLNonNull<any> | GraphQLList<any>>

type PossibleInputType = string | AllNexusNamedInputTypeDefs | GraphQLType

export interface ConfiguredTypegen {
  /** Path for the generated type defs */
  outputPath: string
  /**
   * Determine the path the "globals" are output, useful when you have a monorepo setup and need to isolate
   * the globals from the rest of the types in order to have multiple schemas/ts projects
   */
  globalsPath?: string
  /**
   * If globalsPath is defined, these headers are added to the "globals" generated file, rather than the
   * typegen generated file
   */
  globalsHeaders?: string[]
  /**
   * If "true", declares dedicated interfaces for any inputs / args
   *
   * @default false
   */
  declareInputs?: boolean
}

export interface MergeSchemaConfig {
  /**
   * GraphQL Schema to merge into the Nexus type definitions.
   *
   * We unwrap each type, preserve the "nullable/nonNull" status of any fields & arguments, and then combine
   * with the local Nexus GraphQL types.
   *
   * If you have multiple schemas
   */
  schema: GraphQLSchema
  /**
   * If we want to "merge" specific types, provide a list of the types you wish to merge here.
   *
   * @default 'Query', 'Mutation'
   */
  mergeTypes?: string[] | true
  /**
   * If there are types that we don't want to include from the external schema in our final Nexus generated
   * schema, provide them here.
   */
  skipTypes?: string[]
  /**
   * If there are certain "fields" that we want to skip, we can specify the fields here and we'll ensure they
   * don't get merged into the schema
   */
  skipFields?: Record<string, string[]>
  /**
   * If there are certain arguments for any type fields that we want to skip, we can specify the fields here &
   * ensure they don't get merged into the final schema.
   *
   * @example
   *   skipArgs: {
   *     Mutation: {
   *       createAccount: ['internalId']
   *     }
   *   }
   */
  skipArgs?: Record<string, Record<string, string[]>>
}

export interface BuilderConfigInput {
  /**
   * If we have an external schema that we want to "merge into" our local Nexus schema definitions, we can
   * configure it here.
   *
   * If you have more than one schema that needs merging, you can look into using graphql-tools to pre-merge
   * into a single schema: https://www.graphql-tools.com/docs/schema-merging
   */
  mergeSchema?: MergeSchemaConfig
  /**
   * Generated artifact settings. Set to false to disable all. Set to true to enable all and use default
   * paths. Leave undefined for default behaviour of each artifact.
   */
  outputs?:
    | boolean
    | {
        /**
         * TypeScript declaration file generation settings. This file contains types reflected off your source
         * code. It is how Nexus imbues dynamic code with static guarantees.
         *
         * Defaults to being enabled when `process.env.NODE_ENV !== "production"`. Set to true to enable and
         * emit into default path (see below). Set to false to disable. Set to a string to specify absolute path.
         *
         * The default path is node_modules/@types/nexus-typegen/index.d.ts. This is chosen because TypeScript
         * will pick it up without any configuration needed by you. For more details about the @types system
         * refer to https://www.typescriptlang.org/docs/handbook/tsconfig-json.html#types-typeroots-and-types
         */
        typegen?: boolean | string | ConfiguredTypegen
        /**
         * GraphQL SDL file generation toggle and location.
         *
         * Set to a string to enable and output to an absolute path. Set to true to enable at default path
         * (schema.graphql in the current working directory) Set to false to disable
         *
         * Defaults to true in development and false otherwise.
         *
         * This file is not necessary but may be nice for teams wishing to review SDL in pull-requests or just
         * generally transitioning from a schema-first workflow.
         */
        schema?: boolean | string
      }
  /**
   * Whether the schema & types are generated when the server starts. Default is !process.env.NODE_ENV ||
   * process.env.NODE_ENV === "development"
   */
  shouldGenerateArtifacts?: boolean
  /** Register the Source Types */
  sourceTypes?: SourceTypesConfigOptions
  /**
   * Adjust the Prettier options used while running prettier over the generated output.
   *
   * Can be an absolute path to a Prettier config file like .prettierrc or package.json with "prettier" field,
   * or an object of Prettier options.
   *
   * If provided, you must have prettier available as an importable dep in your project.
   */
  prettierConfig?: string | object
  /**
   * Manually apply a formatter to the generated content before saving, see the `prettierConfig` option if you
   * want to use Prettier.
   */
  formatTypegen?: TypegenFormatFn
  /**
   * Configures the default "nonNullDefaults" for the entire schema the type. Read more about how nexus
   * handles nullability
   */
  nonNullDefaults?: NonNullConfig
  /** List of plugins to apply to Nexus, with before/after hooks executed first to last: before -> resolve -> after */
  plugins?: NexusPlugin[]
  /** Provide if you wish to customize the behavior of the schema printing. Otherwise, uses `printSchema` from graphql-js */
  customPrintSchemaFn?: typeof printSchema
  /** Customize and toggle on or off various features of Nexus. */
  features?: NexusFeaturesInput
  /**
   * Path to the module where your context type is exported
   *
   * @example
   *   contextType: { module: path.join(__dirname, 'context.ts'), export: 'MyContextType' }
   */
  contextType?: TypingImport
  /**
   * If we wish to override the "Root" type for the schema, we can do so by specifying the rootTypes option,
   * which will replace the default roots of Query / Mutation / Subscription
   */
  schemaRoots?: {
    query?: GetGen<'allOutputTypes', string> | AllNexusOutputTypeDefs
    mutation?: GetGen<'allOutputTypes', string> | AllNexusOutputTypeDefs
    subscription?: GetGen<'allOutputTypes', string> | AllNexusOutputTypeDefs
  }
}

export interface BuilderConfig extends Omit<BuilderConfigInput, 'nonNullDefaults' | 'features' | 'plugins'> {
  nonNullDefaults: RequiredDeeply<BuilderConfigInput['nonNullDefaults']>
  features: RequiredDeeply<BuilderConfigInput['features']>
  plugins: RequiredDeeply<BuilderConfigInput['plugins']>
}

export type SchemaConfig = BuilderConfigInput & {
  /**
   * All of the GraphQL types. This is an any for simplicity of developer experience, if it's an object we get
   * the values, if it's an array we flatten out the valid types, ignoring invalid ones.
   */
  types: any
  /**
   * Whether we should process.exit after the artifacts are generated. Useful if you wish to explicitly
   * generate the test artifacts at a certain stage in a startup or build process.
   *
   * @default false
   */
  shouldExitAfterGenerateArtifacts?: boolean
  /**
   * Custom extensions, as [supported in
   * graphql-js](https://github.com/graphql/graphql-js/blob/master/src/type/__tests__/extensions-test.js)
   */
  extensions?: GraphQLSchemaConfig['extensions']
} & NexusGenPluginSchemaConfig

export interface TypegenInfo {
  /** Headers attached to the generate type output */
  headers: string[]
  /** All imports for the source types / context */
  imports: string[]
  /** A map of all GraphQL types and what TypeScript types they should be represented by. */
  sourceTypeMap: { [K in GetGen<'objectNames'>]?: string }
  /** Info about where to import the context from */
  contextTypeImport: TypingImport | undefined
  /**
   * The path to the nexus package for typegen.
   *
   * This setting is only necessary when nexus is being wrapped by another library/framework such that `nexus`
   * is not expected to be a direct dependency at the application level.
   */
  nexusSchemaImportId?: string
}

export type TypeToWalk =
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

export type NexusAcceptedTypeDef = TypeDef | DynamicBlockDef | NexusMeta

export type PluginBuilderLens = {
  hasType: SchemaBuilder['hasType']
  addType: SchemaBuilder['addType']
  setConfigOption: SchemaBuilder['setConfigOption']
  hasConfigOption: SchemaBuilder['hasConfigOption']
  getConfigOption: SchemaBuilder['getConfigOption']
}

/**
 * Builds all of the types, properly accounts for any using "mix". Since the enum types are resolved
 * synchronously, these need to guard for circular references at this step, while fields will guard for it
 * during lazy evaluation.
 */
export class SchemaBuilder {
  /** All objects containing a NEXUS_BUILD / NEXUS_TYPE symbol */
  private nexusMetaObjects = new Set()
  /** Used to check for circular references. */
  private buildingTypes = new Set()
  /** The "final type" map contains all types as they are built. */
  private finalTypeMap: Record<string, GraphQLNamedType> = {}
  /**
   * The "defined type" map keeps track of all of the types that were defined directly as `GraphQL*Type`
   * objects, so we don't accidentally overwrite any.
   */
  private definedTypeMap: Record<string, GraphQLNamedType> = {}
  /**
   * The "pending type" map keeps track of all types that were defined w/ GraphQL Nexus and haven't been
   * processed into concrete types yet.
   */
  private pendingTypeMap: Record<string, AllNexusNamedTypeDefs | null> = {}
  /** All "extensions" to types (adding fields on types from many locations) */
  private typeExtendMap: Record<string, NexusExtendTypeConfig<string>[] | null> = {}
  /** All "extensions" to input types (adding fields on types from many locations) */
  private inputTypeExtendMap: Record<string, NexusExtendInputTypeConfig<string>[] | null> = {}
  /**
   * When we encounter "named" types from graphql-js, we keep them separate from Nexus definitions. This way
   * we can have Nexus definitions take precedence without worrying about conflicts, particularly when we're
   * looking to override behavior from inherited types.
   */
  private graphqlNamedTypeMap: Record<string, AllNexusNamedTypeDefs> = {}

  /**
   * If we're merging against a remote schema, the types from the schema are kept here, for fallbacks /
   * merging when we're building the actual Schema
   */
  private graphqlMergeSchemaMap: Record<string, AllNexusNamedTypeDefs> = {}

  private dynamicInputFields: DynamicInputFields = {}
  private dynamicOutputFields: DynamicOutputFields = {}
  private dynamicOutputProperties: DynamicOutputProperties = {}
  private plugins: NexusPlugin[] = []

  /** All types that need to be traversed for children types */
  private typesToWalk: TypeToWalk[] = []

  /** Root type mapping information annotated on the type definitions */
  private sourceTypings: SourceTypings = {}

  /** Array of missing types */
  private missingTypes: Record<string, MissingType> = {}

  /** Methods we are able to access to read/modify builder state from plugins */
  private builderLens: PluginBuilderLens

  /** Created just before types are walked, this keeps track of all of the resolvers */
  private onMissingTypeFns: Exclude<PluginConfig['onMissingType'], undefined>[] = []

  /** Executed just before types are walked */
  private onBeforeBuildFns: Exclude<PluginConfig['onBeforeBuild'], undefined>[] = []

  /** Executed as the field resolvers are included on the field */
  private onCreateResolverFns: Exclude<PluginConfig['onCreateFieldResolver'], undefined>[] = []

  /** Executed as the field "subscribe" fields are included on the schema */
  private onCreateSubscribeFns: Exclude<PluginConfig['onCreateFieldSubscribe'], undefined>[] = []

  /** Executed after the schema is constructed, for any final verification */
  private onAfterBuildFns: Exclude<PluginConfig['onAfterBuild'], undefined>[] = []

  /** Executed after the object is defined, allowing us to add additional fields to the object */
  private onObjectDefinitionFns: Exclude<PluginConfig['onObjectDefinition'], undefined>[] = []

  /** Executed after the object is defined, allowing us to add additional fields to the object */
  private onInputObjectDefinitionFns: Exclude<PluginConfig['onInputObjectDefinition'], undefined>[] = []

  /** Called immediately after the field is defined, allows for using metadata to define the shape of the field. */
  private onAddArgFns: Exclude<PluginConfig['onAddArg'], undefined>[] = []

  /** Called immediately after the field is defined, allows for using metadata to define the shape of the field. */
  private onAddOutputFieldFns: Exclude<PluginConfig['onAddOutputField'], undefined>[] = []

  /** Called immediately after the field is defined, allows for using metadata to define the shape of the field. */
  private onAddInputFieldFns: Exclude<PluginConfig['onAddInputField'], undefined>[] = []

  /** The `schemaExtension` is created just after the types are walked, but before the fields are materialized. */
  private _schemaExtension?: NexusSchemaExtension

  private config: BuilderConfig

  private get schemaExtension() {
    /* istanbul ignore next */
    if (!this._schemaExtension) {
      throw new Error('Cannot reference schemaExtension before it is created')
    }
    return this._schemaExtension
  }

  constructor(config: BuilderConfigInput) {
    this.config = setConfigDefaults(config)
    /** This array of plugin is used to keep retro-compatibility w/ older versions of nexus */
    this.plugins = this.config.plugins.length > 0 ? this.config.plugins : [fieldAuthorizePlugin()]

    if (!this.plugins.find((f) => f.config.name === 'declarativeWrapping')) {
      this.plugins.push(declarativeWrappingPlugin({ disable: true }))
    }

    this.builderLens = Object.freeze({
      hasType: this.hasType,
      addType: this.addType,
      setConfigOption: this.setConfigOption,
      hasConfigOption: this.hasConfigOption,
      getConfigOption: this.getConfigOption,
    })

    if (config.mergeSchema) {
      this.graphqlMergeSchemaMap = this.handleMergeSchema(config.mergeSchema)
    }
  }

  setConfigOption = <K extends keyof BuilderConfigInput>(key: K, value: BuilderConfigInput[K]) => {
    this.config = {
      ...this.config,
      [key]: value,
    }
  }

  hasConfigOption = (key: keyof BuilderConfigInput): boolean => {
    return this.config.hasOwnProperty(key)
  }

  getConfigOption = <K extends keyof BuilderConfigInput>(key: K): BuilderConfigInput[K] => {
    return this.config[key]
  }

  hasType = (typeName: string): boolean => {
    return Boolean(
      this.pendingTypeMap[typeName] ||
        this.finalTypeMap[typeName] ||
        this.graphqlNamedTypeMap[typeName] ||
        this.graphqlMergeSchemaMap[typeName]
    )
  }

  /**
   * Add type takes a Nexus type, or a GraphQL type and pulls it into an internal "type registry". It also
   * does an initial pass on any types that are referenced on the "types" field and pulls those in too, so
   * you can define types anonymously, without exporting them.
   */
  private addType = (typeDef: NexusAcceptedTypeDef) => {
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

    if (isNexusMeta(typeDef)) {
      this.addToNexusMeta(typeDef)
      return
    }

    // Don't worry about internal types.
    if (typeDef.name?.startsWith('__')) {
      return
    }

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

    // Check the "defined" type map for existing Nexus types. We are able to conflict with external types,
    // as we assume that locally defined types take precedence.
    const existingType = this.pendingTypeMap[typeDef.name]

    // If we already have a "Nexus" type, but it's not the same, trigger mark as an error,
    // otherwise early exit
    if (existingType) {
      if (existingType !== typeDef) {
        throw extendError(typeDef.name)
      }
      return
    }

    if (isNexusNamedTypeDef(typeDef)) {
      if (isNexusNamedOuputTypeDef(typeDef) && typeDef.value.asNexusMethod) {
        this.dynamicOutputFields[typeDef.value.asNexusMethod] = typeDef.name
      }
      if (isNexusNamedInputTypeDef(typeDef) && typeDef.value.asNexusMethod) {
        this.dynamicInputFields[typeDef.value.asNexusMethod] = typeDef.name
      }
      if (isNexusScalarTypeDef(typeDef) && typeDef.value.sourceType) {
        this.sourceTypings[typeDef.name] = typeDef.value.sourceType
      }
    }

    // If it's a concrete GraphQL type, we handle it directly by convering the
    // type to a Nexus structure, and capturing all of the referenced types
    // while we're reconstructing.
    if (isNamedType(typeDef)) {
      // If we've already captured the named type, we can skip it
      if (this.graphqlNamedTypeMap[typeDef.name]) {
        return
      }

      // If we've used decorateType to wrap, then we can grab the types off
      if (typeDef.extensions?.nexus) {
        const { asNexusMethod, sourceType } = Object(typeDef.extensions.nexus)
        if (asNexusMethod) {
          if (isInputType(typeDef)) {
            this.dynamicInputFields[asNexusMethod] = typeDef.name
          }
          if (isOutputType(typeDef)) {
            this.dynamicOutputFields[asNexusMethod] = typeDef.name
          }
        }
        if (sourceType) {
          this.sourceTypings[typeDef.name] = sourceType
        }
      }
      this.graphqlNamedTypeMap[typeDef.name] = this.handleNativeType(typeDef, {
        captureLeafType: (t) => {
          if (!this.graphqlNamedTypeMap[t.name] && t.name !== typeDef.name) {
            this.addType(t)
          }
        },
      })
      if (typeDef.extensions?.nexus) {
        this.addType(this.graphqlNamedTypeMap[typeDef.name])
      }
      return
    }

    this.pendingTypeMap[typeDef.name] = typeDef

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
      if (this.config.mergeSchema?.schema === types) {
        return
      } else if (!this.config.mergeSchema) {
        if (Object.keys(this.graphqlMergeSchemaMap).length) {
          console.error(
            new Error(
              `It looks like you're trying to merge multiple GraphQL schemas.\n Please open a GitHub ticket with more info about your use case.`
            )
          )
        }
        this.graphqlMergeSchemaMap = this.handleMergeSchema({ schema: types })
      } else {
        this.addTypes(types.getTypeMap())
      }
      return
    }
    if (isNexusPlugin(types)) {
      if (!this.plugins?.includes(types)) {
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
      isNexusDynamicOutputProperty(types) ||
      isNexusMeta(types)
    ) {
      this.addType(types)
    } else if (Array.isArray(types)) {
      types.forEach((typeDef) => this.addTypes(typeDef))
    } else if (isObject(types)) {
      Object.keys(types).forEach((key) => this.addTypes(types[key]))
    }
  }

  private addToNexusMeta(type: NexusMeta) {
    if (this.nexusMetaObjects.has(type)) {
      return
    }
    this.nexusMetaObjects.add(type)

    if (isNexusMetaBuild(type)) {
      const types = type[NEXUS_BUILD]()
      this.addTypes(types)
    }
    if (isNexusMetaType(type)) {
      this.addType(resolveNexusMetaType(type))
    }
  }

  private walkTypes() {
    let obj
    while ((obj = this.typesToWalk.shift())) {
      switch (obj.type) {
        case 'input':
          this.walkInputType(obj.value)
          break
        case 'interface':
          this.walkInterfaceType(obj.value)
          break
        case 'object':
          this.walkOutputType(obj.value)
          break
        default:
          casesHandled(obj)
      }
    }
  }

  private beforeWalkTypes() {
    this.plugins.forEach((obj, i) => {
      if (!isNexusPlugin(obj)) {
        throw new Error(`Expected a plugin in plugins[${i}], saw ${obj}`)
      }
      const { config: pluginConfig } = obj
      if (pluginConfig.onInstall) {
        // TODO(tim): remove anys/warning at 1.0
        const installResult = pluginConfig.onInstall(this.builderLens) as any
        if (Array.isArray(installResult?.types)) {
          throw new Error(
            `Nexus no longer supports a return value from onInstall, you should instead use the hasType/addType api (seen in plugin ${pluginConfig.name}). `
          )
        }
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
      if (pluginConfig.onObjectDefinition) {
        this.onObjectDefinitionFns.push(pluginConfig.onObjectDefinition)
      }
      if (pluginConfig.onAddOutputField) {
        this.onAddOutputFieldFns.push(pluginConfig.onAddOutputField)
      }
      if (pluginConfig.onAddInputField) {
        this.onAddInputFieldFns.push(pluginConfig.onAddInputField)
      }
      if (pluginConfig.onAddArg) {
        this.onAddArgFns.push(pluginConfig.onAddArg)
      }
      if (pluginConfig.onInputObjectDefinition) {
        this.onInputObjectDefinitionFns.push(pluginConfig.onInputObjectDefinition)
      }
    })
  }

  private beforeBuildTypes() {
    this.onBeforeBuildFns.forEach((fn) => {
      fn(this.builderLens)
      if (this.typesToWalk.length > 0) {
        this.walkTypes()
      }
    })
  }

  private checkForInterfaceCircularDependencies() {
    const interfaces: Record<string, NexusInterfaceTypeConfig<any>> = {}
    Object.keys(this.pendingTypeMap)
      .map((key) => this.pendingTypeMap[key])
      .filter(isNexusInterfaceTypeDef)
      .forEach((type) => {
        interfaces[type.name] = type.value
      })
    const alreadyChecked: Record<string, boolean> = {}
    const walkType = (
      obj: NexusInterfaceTypeConfig<any>,
      path: string[],
      visited: Record<string, boolean>
    ) => {
      if (alreadyChecked[obj.name]) {
        return
      }
      if (visited[obj.name]) {
        if (obj.name === path[path.length - 1]) {
          throw new Error(`GraphQL Nexus: Interface ${obj.name} can't implement itself`)
        } else {
          throw new Error(
            `GraphQL Nexus: Interface circular dependency detected ${[
              ...path.slice(path.lastIndexOf(obj.name)),
              obj.name,
            ].join(' -> ')}`
          )
        }
      }

      const definitionBlock = new InterfaceDefinitionBlock({
        typeName: obj.name,
        addInterfaces: (i) =>
          i.forEach((config) => {
            const name = typeof config === 'string' ? config : config.value.name
            walkType(interfaces[name], [...path, obj.name], { ...visited, [obj.name]: true })
          }),
        addModification: () => {},
        addField: () => {},
        addDynamicOutputMembers: (block, wrapping) => this.addDynamicOutputMembers(block, 'walk', wrapping),
        warn: () => {},
      })
      obj.definition(definitionBlock)
      alreadyChecked[obj.name] = true
    }
    Object.keys(interfaces).forEach((name) => {
      walkType(interfaces[name], [], {})
    })
  }

  private buildNexusTypes() {
    // If Query isn't defined, set it to null so it falls through to "missingType"
    if (!this.pendingTypeMap.Query && !this.config.schemaRoots?.query && !this.typeExtendMap.Query) {
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
      if (this.typeExtendMap[key] !== null && !this.hasType(key)) {
        this.buildObjectType({
          name: key,
          definition() {},
        })
      }
    })
    Object.keys(this.inputTypeExtendMap).forEach((key) => {
      // If we haven't defined the type, assume it's an input object type
      if (this.inputTypeExtendMap[key] !== null && !this.hasType(key)) {
        this.buildInputObjectType({
          name: key,
          definition() {},
        })
      }
    })
  }

  private createSchemaExtension() {
    this._schemaExtension = new NexusSchemaExtension({
      ...this.config,
      dynamicFields: {
        dynamicInputFields: this.dynamicInputFields,
        dynamicOutputFields: this.dynamicOutputFields,
        dynamicOutputProperties: this.dynamicOutputProperties,
      },
      sourceTypings: this.sourceTypings,
    })
  }

  getFinalTypeMap(): BuildTypes<any> {
    this.beforeWalkTypes()
    this.createSchemaExtension()
    this.walkTypes()
    this.beforeBuildTypes()
    this.checkForInterfaceCircularDependencies()
    this.buildNexusTypes()
    return {
      finalConfig: this.config,
      typeMap: this.finalTypeMap,
      schemaExtension: this.schemaExtension!,
      missingTypes: this.missingTypes,
      onAfterBuildFns: this.onAfterBuildFns,
    }
  }

  private shouldMerge(typeName: string) {
    if (!this.config.mergeSchema) {
      return false
    }
    const { mergeTypes = ['Query', 'Mutation'] } = this.config.mergeSchema

    return Boolean(mergeTypes === true || mergeTypes.includes(typeName))
  }

  private buildInputObjectType(config: NexusInputObjectTypeConfig<any>): GraphQLInputObjectType {
    const fields: NexusInputFieldDef[] = []
    const definitionBlock = new InputDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(this.addInputField(field)),
      addDynamicInputFields: (block, wrapping) => this.addDynamicInputFields(block, wrapping),
      warn: consoleWarn,
    })
    const externalNamedType = this.graphqlMergeSchemaMap[config.name]
    if (this.shouldMerge(config.name) && isNexusInputObjectTypeDef(externalNamedType)) {
      externalNamedType.value.definition(definitionBlock)
    }
    config.definition(definitionBlock)
    this.onInputObjectDefinitionFns.forEach((fn) => {
      fn(definitionBlock, config)
    })
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
        ...config.extensions,
        nexus: new NexusInputObjectTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLInputObjectType(inputObjectTypeConfig))
  }

  private buildObjectType(config: NexusObjectTypeConfig<string>) {
    const fields: NexusOutputFieldDef[] = []
    const interfaces: Implemented[] = []
    const modifications: Record<string, FieldModificationDef<any, any>> = {}
    const definitionBlock = new ObjectDefinitionBlock({
      typeName: config.name,
      addField: (fieldDef) => fields.push(this.addOutputField(fieldDef)),
      addInterfaces: (interfaceDefs) => interfaces.push(...interfaceDefs),
      addModification: (modification) => (modifications[modification.field] = modification),
      addDynamicOutputMembers: (block, wrapping) => this.addDynamicOutputMembers(block, 'build', wrapping),
      warn: consoleWarn,
    })
    const externalNamedType = this.graphqlMergeSchemaMap[config.name]
    if (this.shouldMerge(config.name) && isNexusObjectTypeDef(externalNamedType)) {
      externalNamedType.value.definition(definitionBlock)
    }
    config.definition(definitionBlock)
    this.onObjectDefinitionFns.forEach((fn) => {
      fn(definitionBlock, config)
    })
    const extensions = this.typeExtendMap[config.name]
    if (extensions) {
      extensions.forEach((extension) => {
        extension.definition(definitionBlock)
      })
    }
    this.typeExtendMap[config.name] = null
    if (config.sourceType) {
      this.sourceTypings[config.name] = config.sourceType
    }
    const objectTypeConfig: NexusGraphQLObjectTypeConfig = {
      name: config.name,
      interfaces: () => this.buildInterfaceList(interfaces),
      description: config.description,
      fields: () =>
        this.buildOutputFields(
          fields,
          objectTypeConfig,
          this.buildInterfaceFields(objectTypeConfig, interfaces, modifications)
        ),
      isTypeOf: (config as any).isTypeOf,
      extensions: {
        ...config.extensions,
        nexus: new NexusObjectTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLObjectType(objectTypeConfig))
  }

  private buildInterfaceType(config: NexusInterfaceTypeConfig<any>) {
    const { name, description } = config
    let resolveType: AbstractTypeResolver<string> | undefined = (config as any).resolveType

    const fields: NexusOutputFieldDef[] = []
    const interfaces: Implemented[] = []
    const modifications: Record<string, FieldModificationDef<any, any>> = {}
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: config.name,
      addField: (field) => fields.push(this.addOutputField(field)),
      addInterfaces: (interfaceDefs) => interfaces.push(...interfaceDefs),
      addModification: (modification) => (modifications[modification.field] = modification),
      addDynamicOutputMembers: (block, wrapping) => this.addDynamicOutputMembers(block, 'build', wrapping),
      warn: consoleWarn,
    })
    const externalNamedType = this.graphqlMergeSchemaMap[config.name]
    if (this.shouldMerge(config.name) && isNexusInterfaceTypeDef(externalNamedType)) {
      externalNamedType.value.definition(definitionBlock)
    }
    config.definition(definitionBlock)

    if (config.sourceType) {
      this.sourceTypings[config.name] = config.sourceType
    }
    const interfaceTypeConfig: NexusGraphQLInterfaceTypeConfig = {
      name,
      interfaces: () => this.buildInterfaceList(interfaces),
      resolveType,
      description,
      fields: () =>
        this.buildOutputFields(
          fields,
          interfaceTypeConfig,
          this.buildInterfaceFields(interfaceTypeConfig, interfaces, modifications)
        ),
      extensions: {
        ...config.extensions,
        nexus: new NexusInterfaceTypeExtension(config),
      },
    }
    return this.finalize(new GraphQLInterfaceType(interfaceTypeConfig))
  }

  private addOutputField(field: NexusOutputFieldDef): NexusOutputFieldDef {
    this.onAddOutputFieldFns.forEach((fn) => {
      const result = fn(field)
      if (result) {
        field = result
      }
    })
    return field
  }

  private addInputField(field: NexusInputFieldDef): NexusInputFieldDef {
    this.onAddInputFieldFns.forEach((fn) => {
      const result = fn(field)
      if (result) {
        field = result
      }
    })
    return field
  }

  private buildEnumType(config: NexusEnumTypeConfig<any>) {
    const { members } = config
    const values: GraphQLEnumValueConfigMap = {}
    if (isArray(members)) {
      members.forEach((m) => {
        if (typeof m === 'string') {
          values[m] = { value: m }
        } else {
          values[m.name] = {
            value: typeof m.value === 'undefined' ? m.name : m.value,
            deprecationReason: m.deprecation,
            description: m.description,
            extensions: {
              ...m.extensions,
              nexus: m.extensions?.nexus ?? {},
            },
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
    if (config.sourceType) {
      this.sourceTypings[config.name] = config.sourceType
    }
    return this.finalize(
      new GraphQLEnumType({
        name: config.name,
        values: values,
        description: config.description,
        extensions: {
          ...config.extensions,
          nexus: config.extensions?.nexus ?? {},
        },
      })
    )
  }

  private buildUnionType(config: NexusUnionTypeConfig<any>) {
    let members: UnionMembers | undefined
    let resolveType: AbstractTypeResolver<string> | undefined = (config as any).resolveType

    config.definition(
      new UnionDefinitionBlock({
        typeName: config.name,
        addUnionMembers: (unionMembers) => (members = unionMembers),
      })
    )

    if (config.sourceType) {
      this.sourceTypings[config.name] = config.sourceType
    }
    return this.finalize(
      new GraphQLUnionType({
        name: config.name,
        resolveType,
        description: config.description,
        types: () => this.buildUnionMembers(config.name, members),
        extensions: {
          ...config.extensions,
          nexus: config.extensions?.nexus ?? {},
        },
      })
    )
  }

  private buildScalarType(config: NexusScalarTypeConfig<string>): GraphQLScalarType {
    if (config.sourceType) {
      this.sourceTypings[config.name] = config.sourceType
    }
    return this.finalize(
      new GraphQLScalarType({
        ...config,
        extensions: {
          ...config.extensions,
          nexus: config.extensions?.nexus ?? {},
        },
      })
    )
  }

  private finalize<T extends GraphQLNamedType>(type: T): T {
    this.finalTypeMap[type.name] = type
    return type
  }

  private missingType(typeName: string, fromObject: boolean = false): GraphQLNamedType {
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
            type: new GraphQLNonNull(GraphQLBoolean),
            resolve: () => true,
          },
        },
      })
    }

    if (!this.missingTypes[typeName]) {
      this.missingTypes[typeName] = { fromObject }
    }

    this.addType(UNKNOWN_TYPE_SCALAR)
    return this.getOrBuildType(UNKNOWN_TYPE_SCALAR)
  }

  private buildUnionMembers(unionName: string, members: UnionMembers | undefined) {
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

  private buildInterfaceList(interfaces: (string | NexusInterfaceTypeDef<any>)[]) {
    const list: GraphQLInterfaceType[] = []
    interfaces.forEach((i) => {
      const type = this.getInterface(i)
      list.push(type, ...graphql15InterfaceType(type).getInterfaces())
    })
    return Array.from(new Set(list))
  }

  private buildInterfaceFields(
    forTypeConfig: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig,
    interfaces: (string | NexusInterfaceTypeDef<any>)[],
    modifications: Record<string, FieldModificationDef<any, any>>
  ) {
    const interfaceFieldsMap: GraphQLFieldConfigMap<any, any> = {}
    interfaces.forEach((i) => {
      const config = this.getInterface(i).toConfig()
      Object.keys(config.fields).forEach((field) => {
        const interfaceField = config.fields[field]
        interfaceFieldsMap[field] = interfaceField
        if (modifications[field]) {
          // TODO(tim): Refactor this whole mess
          const { type, field: _field, args, extensions, ...rest } = modifications[field]
          const extensionConfig: NexusOutputFieldConfig<any, any> = hasNexusExtension(extensions?.nexus)
            ? extensions?.nexus?.config ?? {}
            : {}
          interfaceFieldsMap[field] = {
            ...interfaceFieldsMap[field],
            ...rest,
            extensions: {
              ...interfaceField.extensions,
              ...extensions,
              nexus: hasNexusExtension(interfaceField.extensions?.nexus)
                ? interfaceField.extensions?.nexus?.modify(extensionConfig)
                : new NexusFieldExtension(extensionConfig),
            },
          }
          if (typeof type !== 'undefined') {
            let interfaceReplacement: GraphQLOutputType
            if (isNexusWrappingType(type)) {
              const { wrapping, namedType } = unwrapNexusDef(type)
              interfaceReplacement = rewrapAsGraphQLType(
                this.getOrBuildType(namedType as any),
                wrapping as NexusFinalWrapKind[]
              ) as GraphQLOutputType
            } else {
              const { wrapping } = unwrapGraphQLDef(config.fields[field].type)
              interfaceReplacement = rewrapAsGraphQLType(
                this.getOutputType(type),
                wrapping
              ) as GraphQLOutputType
            }
            interfaceFieldsMap[field].type = interfaceReplacement
          }
          if (typeof args !== 'undefined') {
            interfaceFieldsMap[field].args = {
              ...this.buildArgs(args ?? {}, forTypeConfig, field),
              ...interfaceFieldsMap[field].args,
            }
          }
        }
      })
    })
    return interfaceFieldsMap
  }

  private buildOutputFields(
    fields: NexusOutputFieldDef[],
    typeConfig: NexusGraphQLInterfaceTypeConfig | NexusGraphQLObjectTypeConfig,
    intoObject: GraphQLFieldConfigMap<any, any>
  ) {
    fields.forEach((field) => {
      intoObject[field.name] = this.buildOutputField(field, typeConfig)
    })
    return intoObject
  }

  private buildInputObjectFields(
    fields: NexusInputFieldDef[],
    typeConfig: NexusGraphQLInputObjectTypeConfig
  ): GraphQLInputFieldConfigMap {
    const fieldMap: GraphQLInputFieldConfigMap = {}
    fields.forEach((field) => {
      fieldMap[field.name] = this.buildInputObjectField(field, typeConfig)
    })
    return fieldMap
  }

  private getNonNullDefault(
    nonNullDefaultConfig: { nonNullDefaults?: NonNullConfig } | undefined,
    kind: 'input' | 'output'
  ): boolean {
    const { nonNullDefaults = {} } = nonNullDefaultConfig ?? {}

    return nonNullDefaults[kind] ?? this.config.nonNullDefaults[kind] ?? false
  }

  private buildOutputField(
    fieldConfig: NexusOutputFieldDef,
    typeConfig: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig
  ): GraphQLFieldConfig<any, any> {
    if (!fieldConfig.type) {
      /* istanbul ignore next */
      throw new Error(`Missing required "type" field for ${typeConfig.name}.${fieldConfig.name}`)
    }
    const fieldExtension = new NexusFieldExtension(fieldConfig)
    const nonNullDefault = this.getNonNullDefault(typeConfig.extensions?.nexus?.config, 'output')
    const { namedType, wrapping } = unwrapNexusDef(fieldConfig.type)
    const finalWrap = finalizeWrapping(nonNullDefault, wrapping, fieldConfig.wrapping)
    const builderFieldConfig: Omit<NexusGraphQLFieldConfig, 'resolve' | 'subscribe'> = {
      name: fieldConfig.name,
      type: rewrapAsGraphQLType(
        this.getOutputType(namedType as PossibleOutputType),
        finalWrap
      ) as GraphQLOutputType,
      args: this.buildArgs(fieldConfig.args || {}, typeConfig, fieldConfig.name),
      description: fieldConfig.description,
      deprecationReason: fieldConfig.deprecation,
      extensions: {
        ...fieldConfig.extensions,
        nexus: fieldExtension,
      },
    }
    return {
      resolve: this.makeFinalResolver(
        {
          builder: this.builderLens,
          fieldConfig: builderFieldConfig,
          parentTypeConfig: typeConfig as any, // TODO(tim): remove as any when we drop support for 14.x
          schemaConfig: this.config,
          schemaExtension: this.schemaExtension,
        },
        fieldConfig.resolve
      ),
      subscribe: fieldConfig.subscribe,
      ...builderFieldConfig,
    }
  }

  private makeFinalResolver(info: CreateFieldResolverInfo, resolver?: GraphQLFieldResolver<any, any>) {
    const resolveFn = resolver || defaultFieldResolver
    if (this.onCreateResolverFns.length) {
      const toCompose = this.onCreateResolverFns.map((fn) => fn(info)).filter((f) => f) as MiddlewareFn[]
      if (toCompose.length) {
        return composeMiddlewareFns(toCompose, resolveFn)
      }
    }
    return resolveFn
  }

  private buildInputObjectField(
    fieldConfig: NexusInputFieldDef,
    typeConfig: NexusGraphQLInputObjectTypeConfig
  ): GraphQLInputFieldConfig {
    const nonNullDefault = this.getNonNullDefault(typeConfig.extensions?.nexus?.config, 'input')
    const { namedType, wrapping } = unwrapNexusDef(fieldConfig.type)
    const finalWrap = finalizeWrapping(nonNullDefault, wrapping, fieldConfig.wrapping)
    return {
      type: rewrapAsGraphQLType(
        this.getInputType(namedType as PossibleInputType),
        finalWrap
      ) as GraphQLInputType,
      defaultValue: fieldConfig.default,
      description: fieldConfig.description,
      extensions: {
        ...fieldConfig.extensions,
        nexus: fieldConfig.extensions?.nexus ?? {},
      },
    }
  }

  private buildArgs(
    args: ArgsRecord,
    typeConfig: NexusGraphQLObjectTypeConfig | NexusGraphQLInterfaceTypeConfig,
    fieldName: string
  ): GraphQLFieldConfigArgumentMap {
    const allArgs: GraphQLFieldConfigArgumentMap = {}
    for (const [argName, arg] of Object.entries(args)) {
      const nonNullDefault = this.getNonNullDefault(typeConfig.extensions?.nexus?.config, 'input')
      let finalArgDef: NexusFinalArgConfig = {
        ...normalizeArgWrapping(arg).value,
        fieldName,
        argName,
        parentType: typeConfig.name,
        configFor: 'arg',
      }
      for (const onArgDef of this.onAddArgFns) {
        const result = onArgDef(finalArgDef)
        if (result != null) {
          finalArgDef = result
        }
      }
      const { namedType, wrapping } = unwrapNexusDef(finalArgDef.type)
      const finalWrap = finalizeWrapping(nonNullDefault, wrapping)
      allArgs[argName] = {
        type: rewrapAsGraphQLType(
          this.getInputType(namedType as PossibleInputType),
          finalWrap
        ) as GraphQLInputType,
        description: finalArgDef.description,
        defaultValue: finalArgDef.default,
        extensions: {
          ...finalArgDef.extensions,
          nexus: finalArgDef.extensions?.nexus ?? {},
        },
      }
    }
    return allArgs
  }

  private getInterface(name: string | NexusInterfaceTypeDef<any>): GraphQLInterfaceType {
    const type = this.getOrBuildType(name)
    if (!isInterfaceType(type)) {
      /* istanbul ignore next */
      throw new Error(`Expected ${name} to be an interfaceType, saw ${type.constructor.name}(${type.name})`)
    }
    return type
  }

  private getInputType(
    possibleInputType: PossibleInputType
  ): Exclude<GraphQLInputType, GraphQLNonNull<any> | GraphQLList<any>> {
    const nexusNamedType = getNexusNamedType(possibleInputType)
    const graphqlType = this.getOrBuildType(nexusNamedType)
    if (!isInputObjectType(graphqlType) && !isLeafType(graphqlType)) {
      /* istanbul ignore next */
      throw new Error(
        `Expected ${nexusNamedType} to be a possible input type, saw ${graphqlType.constructor.name}(${graphqlType.name})`
      )
    }
    return graphqlType
  }

  private getOutputType(
    possibleOutputType: PossibleOutputType
  ): Exclude<GraphQLOutputType, GraphQLNonNull<any> | GraphQLList<any>> {
    const graphqlType = this.getOrBuildType(possibleOutputType)
    if (!isOutputType(graphqlType)) {
      /* istanbul ignore next */
      throw new Error(
        `Expected ${possibleOutputType} to be a valid output type, saw ${graphqlType.constructor.name}`
      )
    }
    return graphqlType
  }

  private getObjectType(name: string | NexusObjectTypeDef<string>): GraphQLObjectType {
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

  private getOrBuildType(
    type: string | AllNexusNamedTypeDefs | GraphQLNamedType,
    fromObject: boolean = false
  ): GraphQLNamedType {
    invariantGuard(type)

    if (isNamedType(type)) {
      return type
    }

    if (isNexusNamedTypeDef(type)) {
      return this.getOrBuildType(type.name, true)
    }

    if (SCALARS[type]) {
      return SCALARS[type]
    }
    if (this.finalTypeMap[type]) {
      return this.finalTypeMap[type]
    }
    if (this.buildingTypes.has(type)) {
      /* istanbul ignore next */
      throw new Error(
        `GraphQL Nexus: Circular dependency detected, while building types ${Array.from(this.buildingTypes)}`
      )
    }
    const pendingType =
      this.pendingTypeMap[type] ?? this.graphqlNamedTypeMap[type] ?? this.graphqlMergeSchemaMap[type]

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
        console.warn('Unknown kind of type def to build. It will be ignored. The type def was: %j', type)
      }
    }
    return this.missingType(type, fromObject)
  }

  private walkInputType<T extends NexusShapedInput>(obj: T) {
    const definitionBlock = new InputDefinitionBlock({
      typeName: obj.name,
      addField: (f) => this.maybeTraverseInputFieldType(f),
      addDynamicInputFields: (block, wrapping) => this.addDynamicInputFields(block, wrapping),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  private addDynamicInputFields(block: InputDefinitionBlock<any>, wrapping?: NexusWrapKind[]) {
    eachObj(this.dynamicInputFields, (val, methodName) => {
      if (typeof val === 'string') {
        return this.addDynamicField(methodName, val, block)
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        return val.value.factory({
          args,
          typeDef: block,
          builder: this.builderLens,
          typeName: block.typeName,
          wrapping,
        })
      }
    })
  }

  private addDynamicOutputMembers(
    block: OutputDefinitionBlock<any>,
    stage: 'walk' | 'build',
    wrapping?: NexusWrapKind[]
  ) {
    eachObj(this.dynamicOutputFields, (val, methodName) => {
      if (typeof val === 'string') {
        return this.addDynamicField(methodName, val, block)
      }
      // @ts-ignore
      block[methodName] = (...args: any[]) => {
        return val.value.factory({
          args,
          typeDef: block,
          builder: this.builderLens,
          typeName: block.typeName,
          stage,
          wrapping,
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

  private addDynamicField(
    methodName: string,
    typeName: string,
    block: OutputDefinitionBlock<any> | InputDefinitionBlock<any>
  ) {
    // @ts-ignore
    block[methodName] = (fieldName: string, opts: any) => {
      let fieldConfig = {
        type: typeName,
      }

      /* istanbul ignore if */
      if (typeof opts === 'function') {
        throw new Error(messages.removedFunctionShorthand(block.typeName, fieldName))
      } else {
        fieldConfig = { ...fieldConfig, ...opts }
      }

      // @ts-ignore
      block.field(fieldName, fieldConfig)
    }
  }

  private walkOutputType<T extends NexusShapedOutput>(obj: T) {
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
      addDynamicOutputMembers: (block, wrapping) => this.addDynamicOutputMembers(block, 'walk', wrapping),
      addModification: (o) => this.maybeTraverseModification(o),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  private walkInterfaceType(obj: NexusInterfaceTypeConfig<any>) {
    const definitionBlock = new InterfaceDefinitionBlock({
      typeName: obj.name,
      addModification: (o) => this.maybeTraverseModification(o),
      addInterfaces: (i) => {
        i.forEach((j) => {
          if (typeof j !== 'string') {
            this.addType(j)
          }
        })
      },
      addField: (f) => this.maybeTraverseOutputFieldType(f),
      addDynamicOutputMembers: (block, wrapping) => this.addDynamicOutputMembers(block, 'walk', wrapping),
      warn: () => {},
    })
    obj.definition(definitionBlock)
    return obj
  }

  private maybeTraverseModification(mod: FieldModificationDef<any, any>) {
    const { type, args } = mod
    if (type) {
      const namedFieldType = getNexusNamedType(mod.type)
      if (typeof namedFieldType !== 'string') {
        this.addType(namedFieldType)
      }
    }
    if (args) {
      this.traverseArgs(args)
    }
  }

  private maybeTraverseOutputFieldType(type: NexusOutputFieldDef) {
    const { args, type: fieldType } = type
    const namedFieldType = getNexusNamedType(fieldType)
    if (typeof namedFieldType !== 'string') {
      this.addType(namedFieldType)
    }
    if (args) {
      this.traverseArgs(args)
    }
  }

  private traverseArgs(args: Record<string, AllNexusArgsDefs>) {
    eachObj(args, (val) => {
      const namedArgType = getArgNamedType(val)
      if (typeof namedArgType !== 'string') {
        this.addType(namedArgType)
      }
    })
  }

  private maybeTraverseInputFieldType(type: NexusInputFieldDef) {
    const { type: fieldType } = type
    const namedFieldType = getNexusNamedType(fieldType)
    if (typeof namedFieldType !== 'string') {
      this.addType(namedFieldType)
    }
  }

  /**
   * Given a "mergeSchema", gathers all of the types and constructs them into a map of types that we keep as a
   * "merge schema"
   *
   * @param config
   */
  private handleMergeSchema(config: MergeSchemaConfig) {
    const { types } = config.schema.toConfig()
    const mergedTypes: Record<string, AllNexusNamedTypeDefs> = {}

    // We don't need to worry about capturing any types while walking,
    // because we have the entire schema
    for (const type of types) {
      if (type.name.startsWith('__')) {
        continue
      }
      if (config.skipTypes?.includes(type.name)) {
        continue
      }
      mergedTypes[type.name] = this.handleNativeType(type, config)
    }
    return mergedTypes
  }

  private handleNativeType(type: GraphQLType, config: RebuildConfig) {
    while (isWrappingType(type)) {
      type = type.ofType
    }
    this.pendingTypeMap[type.name] ??= null
    return rebuildNamedType(type, config)
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

/** Builds the schema, we may return more than just the schema from this one day. */
export function makeSchemaInternal(config: SchemaConfig) {
  const builder = new SchemaBuilder(config)
  builder.addTypes(config.types)
  if (config.schemaRoots) {
    builder.addTypes(config.schemaRoots)
  }
  const { finalConfig, typeMap, missingTypes, schemaExtension, onAfterBuildFns } = builder.getFinalTypeMap()

  function getRootType(rootType: 'query' | 'mutation' | 'subscription', defaultType: string) {
    const rootTypeVal = config.schemaRoots?.[rootType] ?? defaultType
    let returnVal: null | GraphQLNamedType = null
    if (typeof rootTypeVal === 'string') {
      returnVal = typeMap[rootTypeVal]
    } else if (rootTypeVal) {
      if (isNexusObjectTypeDef(rootTypeVal)) {
        returnVal = typeMap[rootTypeVal.name]
      } else if (isObjectType(rootTypeVal)) {
        returnVal = typeMap[rootTypeVal.name]
      }
    }
    if (returnVal && !isObjectType(returnVal)) {
      throw new Error(`Expected ${rootType} to be a objectType, saw ${returnVal.constructor.name}`)
    }
    return returnVal
  }

  const schema = new GraphQLSchema({
    query: getRootType('query', 'Query'),
    mutation: getRootType('mutation', 'Mutation'),
    subscription: getRootType('subscription', 'Subscription'),
    types: objValues(typeMap),
    extensions: {
      ...config.extensions,
      nexus: schemaExtension,
    },
  }) as NexusGraphQLSchema

  onAfterBuildFns.forEach((fn) => fn(schema))

  return { schema, missingTypes, finalConfig }
}

export function setConfigDefaults(config: BuilderConfigInput): BuilderConfig {
  const defaults: {
    features: BuilderConfig['features']
    nonNullDefaults: BuilderConfig['nonNullDefaults']
    plugins: BuilderConfig['plugins']
  } = {
    features: {
      abstractTypeRuntimeChecks: true,
      abstractTypeStrategies: {
        isTypeOf: false,
        resolveType: true,
        __typename: false,
      },
    },
    nonNullDefaults: {
      input: false,
      output: false,
    },
    plugins: [fieldAuthorizePlugin()],
  }

  if (!config.features) {
    config.features = defaults.features
  } else {
    // abstractTypeStrategies

    if (!config.features.abstractTypeStrategies) {
      config.features.abstractTypeStrategies = defaults.features.abstractTypeStrategies
    } else {
      config.features.abstractTypeStrategies.__typename =
        config.features.abstractTypeStrategies.__typename ?? false
      config.features.abstractTypeStrategies.isTypeOf =
        config.features.abstractTypeStrategies.isTypeOf ?? false
      config.features.abstractTypeStrategies.resolveType =
        config.features.abstractTypeStrategies.resolveType ?? false
    }

    // abstractTypeRuntimeChecks
    if (config.features.abstractTypeStrategies.__typename === true) {
      // Discriminant Model Field strategy cannot be used with runtime checks because at runtime
      // we cannot know if a resolver for a field whose type is an abstract type includes __typename
      // in the returned model data.
      config.features.abstractTypeRuntimeChecks = false
    }
    if (config.features.abstractTypeRuntimeChecks === undefined) {
      config.features.abstractTypeRuntimeChecks = defaults.features.abstractTypeRuntimeChecks
    }
  }

  config.plugins = config.plugins ?? []
  config.nonNullDefaults = {
    ...defaults.nonNullDefaults,
    ...(config.nonNullDefaults ?? {}),
  }

  return config as BuilderConfig
}
