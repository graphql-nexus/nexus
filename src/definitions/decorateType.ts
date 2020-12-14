import { GraphQLNamedType } from 'graphql'
import { SourceTypingDef } from './_types'

export interface TypeExtensionConfig {
  asNexusMethod?: string
  sourceType?: SourceTypingDef
}

export type NexusTypeExtensions = {
  nexus: TypeExtensionConfig
}

export function decorateType<T extends GraphQLNamedType>(type: T, config: TypeExtensionConfig): T {
  type.extensions = {
    ...type.extensions,
    nexus: {
      asNexusMethod: config.asNexusMethod,
      sourceType: config.sourceType,
    },
  }
  return type as any
}
