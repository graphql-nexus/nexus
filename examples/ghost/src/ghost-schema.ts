import { fieldAuthorizePlugin, makeSchema } from 'nexus'
import path from 'path'
import * as allTypes from './schema'

export const schema = makeSchema({
  types: allTypes,
  outputs: {
    schema: path.join(__dirname, 'ghost-schema.graphql'),
    typegen: path.join(__dirname, 'generated', 'ghost-nexus.ts'),
  },
  plugins: [fieldAuthorizePlugin()],
  sourceTypes: {
    modules: [
      {
        module: path.join(__dirname, 'generated', 'ghost-db-types.ts'),
        alias: 'db',
        typeMatch: (type) => new RegExp(`(?:interface)\\s+(${type.name}s)\\W`),
      },
    ],
    mapping: {
      Date: 'Date',
    },
  },
  contextType: {
    module: path.join(__dirname, 'data-sources', 'Context.ts'),
    export: 'Context',
  },
  prettierConfig: require.resolve('../../../.prettierrc'),
})
