import type { GraphQLNamedType } from 'graphql'
import type { SourceTypingDef } from './_types'

export interface TypeExtensionConfig {
  asNexusMethod?: string
  sourceType?: SourceTypingDef
}

export function decorateType<T extends GraphQLNamedType>(type: T, config: TypeExtensionConfig): T {
  type.extensions = {
    ...type.extensions,
    nexus: {
      ...Object(type.extensions?.nexus),
      ...config,
    },
  }
  return type
}
