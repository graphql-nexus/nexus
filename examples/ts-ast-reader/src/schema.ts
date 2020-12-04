import { makeSchema } from 'nexus'
import { GraphQLNamedType, isObjectType } from 'graphql'
import path from 'path'
import * as types from './types'

export const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, '../ts-ast-reader-schema.graphql'),
    typegen: path.join(__dirname, 'ts-ast-reader-typegen.ts'),
  },
  typegenAutoConfig: {
    sources: [
      {
        alias: 'ts',
        source: 'typescript',
        glob: false,
        typeMatch: tsTypeMatch,
      },
      {
        alias: 't',
        source: path.join(__dirname, './types/index.ts'),
        onlyTypes: [],
      },
    ],
    contextType: 't.ContextType',
    backingTypeMap: {
      Token: 'ts.Token<any>',
    },
    // debug: true,
  },
  prettierConfig: require.resolve('../../../.prettierrc'),
  nonNullDefaults: {
    output: true,
  },
  features: {
    abstractTypeStrategies: {
      resolveType: true,
    },
  },
})

/**
 * When the type is a "Node", we want to first look for types with
 * the name `Node`, e.g. TypeReferenceNode vs TypeReference
 */
function tsTypeMatch(type: GraphQLNamedType, defaultMatch: RegExp) {
  if (isNodeType(type)) {
    return [new RegExp(`(?:interface|type|class)\\s+(${type.name}Node)\\W`, 'g'), defaultMatch]
  }
  return defaultMatch
}

const isNodeType = (type: GraphQLNamedType) =>
  Boolean(isObjectType(type) && type.getInterfaces().find((i) => i.name === 'Node'))
