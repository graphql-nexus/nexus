import { GraphQLNamedType, GraphQLSchema, isObjectType, specifiedDirectives } from 'graphql'
import { isNexusObjectTypeDef } from './definitions/wrapping'
import {
  AdditionalGraphQLSchemaConfigOptions,
  ConfiguredTypegen,
  MakeSchemaOptions,
  SchemaBuilder,
  SchemaConfig,
} from './builder'
import type { NexusGraphQLSchema } from './definitions/_types'
import { TypegenMetadata } from './typegenMetadata'
import { resolveTypegenConfig } from './typegenUtils'
import { assertNoMissingTypes, objValues, runAbstractTypeRuntimeChecks } from './utils'

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined by the GraphQL Nexus layer or any
 * manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the root query type.
 */
export function makeSchema(config: SchemaConfig): NexusGraphQLSchema {
  const { schema, missingTypes, finalConfig, hasSDLDirectives } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  const sdl = typegenConfig.outputs.schema
  const typegen = typegenConfig.outputs.typegen
  if (sdl || typegen) {
    // Generating in the next tick allows us to use the schema
    // in the optional thunk for the typegen config
    const typegenPromise = new TypegenMetadata(typegenConfig).generateArtifacts(schema, hasSDLDirectives)
    if (config.shouldExitAfterGenerateArtifacts) {
      let typegenPath = '(not enabled)'
      if (typegenConfig.outputs.typegen) {
        typegenPath = typegenConfig.outputs.typegen.outputPath
        if (typegenConfig.outputs.typegen.globalsPath) {
          typegenPath += ` / ${typegenConfig.outputs.typegen.globalsPath}`
        }
      }
      typegenPromise
        .then(() => {
          console.log(`Generated Artifacts:
          TypeScript Types  ==> ${typegenPath}
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
  runAbstractTypeRuntimeChecks(schema, finalConfig.features)
  return schema
}

/** Like makeSchema except that typegen is always run and waited upon. */
export async function generateSchema(config: SchemaConfig): Promise<NexusGraphQLSchema> {
  const { schema, missingTypes, finalConfig, hasSDLDirectives } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  await new TypegenMetadata(typegenConfig).generateArtifacts(schema, hasSDLDirectives)
  assertNoMissingTypes(schema, missingTypes)
  runAbstractTypeRuntimeChecks(schema, finalConfig.features)
  return schema
}

/**
 * Mainly useful for testing, generates the schema and returns the artifacts that would have been otherwise
 * written to the filesystem.
 */
generateSchema.withArtifacts = async (
  config: SchemaConfig,
  typegen: string | null | ConfiguredTypegen = null
): Promise<{
  schema: NexusGraphQLSchema
  schemaTypes: string
  tsTypes: string
  globalTypes: string | null
}> => {
  const { schema, missingTypes, finalConfig, hasSDLDirectives } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  const { schemaTypes, tsTypes, globalTypes } = await new TypegenMetadata(
    typegenConfig
  ).generateArtifactContents(schema, typegen, hasSDLDirectives)
  assertNoMissingTypes(schema, missingTypes)
  runAbstractTypeRuntimeChecks(schema, finalConfig.features)
  return { schema, schemaTypes, tsTypes, globalTypes }
}

/** Builds the schema, we may return more than just the schema from this one day. */
export function makeSchemaInternal(config: SchemaConfig) {
  const builder = new SchemaBuilder(config)
  builder.addTypes(config.types)
  if (config.schemaRoots) {
    builder.addTypes(config.schemaRoots)
  }

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

  const {
    finalConfig,
    typeMap,
    missingTypes,
    schemaExtension,
    onAfterBuildFns,
    customDirectives,
    schemaDirectives,
    hasSDLDirectives,
  } = builder.getFinalTypeMap()

  const schema = new GraphQLSchema({
    ...extractGraphQLSchemaOptions(config),
    query: getRootType('query', 'Query'),
    mutation: getRootType('mutation', 'Mutation'),
    subscription: getRootType('subscription', 'Subscription'),
    types: objValues(typeMap),
    extensions: {
      ...config.extensions,
      nexus: schemaExtension,
    },
    directives: [...specifiedDirectives, ...Object.values(customDirectives)],
    ...schemaDirectives,
  }) as NexusGraphQLSchema

  onAfterBuildFns.forEach((fn) => fn(schema))

  return { schema, missingTypes, finalConfig, hasSDLDirectives }
}

type OmittedVals = Partial<{ [K in keyof MakeSchemaOptions]: never }>

function extractGraphQLSchemaOptions(
  config: SchemaConfig
): Partial<AdditionalGraphQLSchemaConfigOptions & OmittedVals> {
  const {
    formatTypegen,
    nonNullDefaults,
    mergeSchema,
    outputs,
    shouldExitAfterGenerateArtifacts,
    shouldGenerateArtifacts,
    schemaRoots,
    sourceTypes,
    prettierConfig,
    plugins,
    customPrintSchemaFn,
    features,
    contextType,
    ...graphqlConfigOpts
  } = config
  return graphqlConfigOpts
}
