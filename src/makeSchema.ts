import { makeSchemaInternal, SchemaConfig } from './builder'
import type { NexusGraphQLSchema } from './definitions/_types'
import { TypegenMetadata } from './typegenMetadata'
import { resolveTypegenConfig } from './typegenUtils'
import { assertNoMissingTypes, runAbstractTypeRuntimeChecks } from './utils'

/**
 * Defines the GraphQL schema, by combining the GraphQL types defined by the GraphQL Nexus layer or any
 * manually defined GraphQLType objects.
 *
 * Requires at least one type be named "Query", which will be used as the root query type.
 */
export function makeSchema(config: SchemaConfig): NexusGraphQLSchema {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  const sdl = typegenConfig.outputs.schema
  const typegen = typegenConfig.outputs.typegen
  if (sdl || typegen) {
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
  runAbstractTypeRuntimeChecks(schema, finalConfig.features)
  return schema
}

/** Like makeSchema except that typegen is always run and waited upon. */
export async function generateSchema(config: SchemaConfig): Promise<NexusGraphQLSchema> {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  await new TypegenMetadata(typegenConfig).generateArtifacts(schema)
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
  typeFilePath: string | null = null
): Promise<{
  schema: NexusGraphQLSchema
  schemaTypes: string
  tsTypes: string
}> => {
  const { schema, missingTypes, finalConfig } = makeSchemaInternal(config)
  const typegenConfig = resolveTypegenConfig(finalConfig)
  const { schemaTypes, tsTypes } = await new TypegenMetadata(typegenConfig).generateArtifactContents(
    schema,
    typeFilePath
  )
  assertNoMissingTypes(schema, missingTypes)
  runAbstractTypeRuntimeChecks(schema, finalConfig.features)
  return { schema, schemaTypes, tsTypes }
}
