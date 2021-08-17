/// <reference path="./kitchen-sink.gen.ts" />
import {
  connectionPlugin,
  fieldAuthorizePlugin,
  makeSchema,
  nullabilityGuardPlugin,
  queryComplexityPlugin,
} from 'nexus'
import { ApolloServer } from 'apollo-server'
import { separateOperations } from 'graphql'
import { fieldExtensionsEstimator, getComplexity, simpleEstimator } from 'graphql-query-complexity'
import path from 'path'
import { logMutationTimePlugin, NodePlugin } from './example-plugins'
import * as types from './kitchen-sink-definitions'

const DEBUGGING_CURSOR = false

let fn = DEBUGGING_CURSOR ? (i: string) => i : undefined

const schema = makeSchema({
  types,
  outputs: {
    schema: path.join(__dirname, '../kitchen-sink-schema.graphql'),
    typegen: {
      outputPath: path.join(__dirname, './kitchen-sink.gen.ts'),
      globalsPath: path.join(__dirname, './kitchen-sink-globals.gen.ts'),
    },
  },
  plugins: [
    NodePlugin,
    connectionPlugin({
      encodeCursor: fn,
      decodeCursor: fn,
    }),
    queryComplexityPlugin(),
    logMutationTimePlugin,
    fieldAuthorizePlugin(),
    nullabilityGuardPlugin({
      shouldGuard: true,
      fallbackValues: {
        ID: () => 'MISSING_ID',
        Int: () => -1,
        Date: () => new Date(0),
        Boolean: () => false,
        String: () => '',
      },
    }),
  ],
  prettierConfig: require.resolve('../../../.prettierrc'),
  features: {
    abstractTypeStrategies: {
      __typename: true,
      resolveType: true,
    },
  },
})

const server = new ApolloServer({
  schema,
  plugins: [
    {
      requestDidStart: () => ({
        didResolveOperation({ request, document }) {
          const complexity = getComplexity({
            schema,
            // To calculate query complexity properly,
            // we have to check if the document contains multiple operations
            // and eventually extract it operation from the whole query document.
            query: request.operationName ? separateOperations(document)[request.operationName] : document,
            // The variables for our GraphQL query
            variables: request.variables,
            // Add any number of estimators. The estimators are invoked in order, the first
            // numeric value that is being returned by an estimator is used as the field complexity.
            // If no estimator returns a value, an exception is raised.
            estimators: [
              fieldExtensionsEstimator(),
              // Add more estimators here...
              // This will assign each field a complexity of 1
              // if no other estimator returned a value.
              simpleEstimator({ defaultComplexity: 1 }),
            ],
          })
          // Here we can react to the calculated complexity,
          // like compare it with max and throw error when the threshold is reached.
          if (complexity >= 100) {
            throw new Error(
              `Sorry, too complicated query! ${complexity} is over 100 that is the max allowed complexity.`
            )
          }
          // And here we can e.g. subtract the complexity point from hourly API calls limit.
          console.log('Used query complexity points:', complexity)
        },
      }),
    },
  ],
})

const port = process.env.PORT || 4000

server.listen({ port }, () => console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`))
