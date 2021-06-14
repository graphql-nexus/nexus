import { decorateType } from 'nexus'
import { GraphQLDate } from 'graphql-scalars'

export const GQLDate = decorateType(GraphQLDate, {
  sourceType: 'Date',
  asNexusMethod: 'date',
})

export * from './Post'
export * from './Query'
export * from './User'
