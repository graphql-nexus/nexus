import { decorateType } from '@nexus/schema'
import { GraphQLDate } from 'graphql-scalars'

export const GQLDate = decorateType(GraphQLDate, {
  sourceType: 'Date',
  asNexusMethod: 'date',
})

export * from './Post'
export * from './Query'
export * from './User'
